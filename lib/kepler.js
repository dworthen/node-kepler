/*******************************************************
* Author: Derek Worthen
* Library: keplerjs
* Version: 0.0.1
********************************************************/

/*****************************************
* Resolving dependencies
******************************************/
var program = require('commander'),
    fs      = require('fs'),
    path    = require('path'),
    ejs     = require('ejs'),
    marked  = require('marked'),
    props   = require('props');

// exporting the entire library
kepler = module.exports;


/*******************************************
* Extending the Object prototype.
********************************************/

// Merges obj2 into obj1
kepler.merge = function merge (obj1, obj2) {
	for(var key in obj2) {
		obj1[key] = obj2[key];
	}
};

// Returns the number of top level keys in the object
// ToDo: Return the number of all of the elements in the obj.
kepler.length = function length (obj) {
	var count = 0;
	for(var key in obj) {
		count++;
	}
	return count;
};

/*******************************************
* Native functional configs
*******************************************/

	
/****************************************
* Setting Default variables. 
*****************************************/
var srcDir          = path.resolve('./'),
		projDestination = path.join(srcDir, './_site/'),
		layoutDir       = path.join(srcDir, './_layouts/'),
		ignoredFiles    = ['.*', '_*', 'package.json', 'node_modules'],
		postDir         = path.join(srcDir, './_posts/'),
		desPost         = './',
		paginate        = {use: false},
		filesToBeCreated;
// kepler.functionalConfigs = {Already wat
// 	layout: kepler.translateFile
// };

kepler.config;


/***************************************
* Override the default values with those found in the config file
***************************************/
kepler.checkForConfigFile = function () {
	var yamlConfigFile = path.join(srcDir, './_config.yml'),
			jsonConfigFile = path.join(srcDir, './_config.json');
	if(path.existsSync(yamlConfigFile)) {
		kepler.config = props(fs.readFileSync(yamlConfigFile, 'utf-8'));
	} else if(path.existsSync(jsonConfigFile)) {
		kepler.config = props(fs.readFileSync(jsonConfigFile, 'utf-8'));
	} else {
		kepler.config = {};
	}

	// Set directory
	if(kepler.config.dir) {
		srcDir = kepler.config.dir;
	}

	// Set destination
	if(kepler.config.destination) {
		projDestination = kepler.config.destination;
	}

	// Set Layout Directory
	if(kepler.config.layoutDir) {
		layoutDir = kepler.config.layoutDir;
	}

	// Set posts directory
	if(kepler.config.postsDir) {
		postDir = kepler.config.postsDir;
	}
	
	// add to the ignoredFiles list.
	if(kepler.config.ignoredFiles) {
		ignoredFiles = ignoredFiles.concat(kepler.config.ignoredFiles);
	}
};

/**********************************************
* Setter functions
* Mainly used in the terminal to override default
* Values
***********************************************/

kepler.setDir = function (dir) {
	srcDir = path.resolve(dir);
};

kepler.setDestination = function (dir) {
	projDestination = path.join(srcDir, dir);
};

kepler.getDes = function () {
	return projDestination;
};

kepler.setLayoutDir = function (dir) {
	layoutDir = path.join(srcDir, dir);
};

kepler.setIgnoredFiles = function (arr) {
	ignoredFiles = arr;
};

/*
* Creates an array of all of the files and directories in the project directory
* Excluding any files we do not want. 
*/
kepler.readProject = function (dir) {
	dir = dir || srcDir;
	var files = fs.readdirSync(dir),
			stats,
			newFiles,
			re,
			results;

	files.forEach(function(file) {
		stats = fs.lstatSync(path.join(dir, file));
		if(stats.isDirectory()) {
			newFiles = kepler.readProject(path.join(dir, file) + '/');
			files = files.concat(newFiles);
		}
	});
	var F = files.map(function(single) {
		re = new RegExp(dir);
		results = re.exec(single);
		if(results) {
			return single.slice(re.lastIndex);
		} else {
			return path.join(dir, single);
		}
	});
	files = F.filter(kepler.isNotIgnored);
	filesToBeCreated = files;
	return files;
};

kepler.isNotIgnored = function (file) {
	var match = true,
			re;

	ignoredFiles.forEach(function(ifile) {
		ifile = path.join(srcDir, ifile);
		ifile = ifile.replace(/\//g, '\\/');
		ifile = ifile.replace(/\./g, '\\.');
		ifile = ifile.replace(/\*/g, '.*');
		re = new RegExp(ifile, 'gi');
		if(re.test(file)) {
			match = false;
		}
	});
	return match;
};


kepler.createDestination = function (destinationFiles) {
	destinationFiles = destinationFiles || filesToBeCreated;
	var files = [],
			stats,
			re,
			results,
			des;

	if(!path.existsSync(projDestination)) {
		fs.mkdir(projDestination, '7777');
	}
	destinationFiles.forEach(function (file) {
		stats = fs.lstatSync(file);
		re = new RegExp(srcDir, 'ig');
		results = re.exec(file);
		des;
		if(results) {
			des = projDestination + file.slice(re.lastIndex);
		} else {
			des = projDestination + file;
		}
		files.push(des);
		if(stats.isDirectory()) {
			if(!path.existsSync(des)) {
				fs.mkdir(des, '7777');
			}
		} else {
			// Create the destination file off of the source file
			kepler.createFile(file, des);
		}
	});
};

kepler.createFile = function (srcFile, desFile) {
	var srcContent = fs.readFileSync(srcFile, 'utf-8'),
			propObj    = props(srcContent),
			extname    = path.extname(srcFile),
			html;
	if(kepler.length(propObj) > 1) {
		for(var key in propObj) {
			if(key === '__content') {
				propObj['content'] = propObj[key];
			}
		}
		if(extname === '.md') {
			propObj['content'] = marked(propObj['content']);
			desFile = path.join(path.dirname(desFile), path.basename(desFile, '.md') + '.html');
		}
	} else if(extname === '.md') {
		srcContent = marked(srcContent);
		desFile = path.join(path.dirname(desFile), path.basename(desFile, '.md') + '.html');
	}
	if(propObj['layout']) {
		srcContent = kepler.translateFile(propObj);
	}
	if(srcContent) {
		fs.writeFileSync(desFile, srcContent);
	}
};

kepler.parseContent = function (parse) {
	for(var key in parse) {
		if(key === '__content') {
			parse['content'] = parse[key];
		}
		for (var k in kepler.functionalConfigs) {
			if(key === k) {
				parse[key] = kepler.functionalConfigs[k](parse[key]);
			}
		}
	}
	return parse;
};

kepler.translateFile = function (file) {
	var layoutFile = path.join(layoutDir, file['layout'] + '.ejs'),
			templateContents,
			html;
	if(path.existsSync(layoutFile)) {
		templateContents = fs.readFileSync(layoutFile, 'utf-8');
		html = ejs.render(templateContents, {
			locals: file
		});
		return html;
	}
	return null;
};


kepler.createPosts = function (dir) {
	dir = dir || postDir;

	var files = readdirSync(dir);

	files.foreach
};

