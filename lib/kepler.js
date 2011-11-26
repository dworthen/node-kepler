/*********************************************************
* Author: Derek Worthen
* Name: Kepler Framework
* Description: Static website generator,
*	see the documentation for more information: 
* dworthen.github.com/node-kepler/
**********************************************************/

/****************************************************
* Resolving Dependencies
*****************************************************/

var fs     = require('fs'),
		path   = require('path'),
		exec   = require('child_process').exec,
		props  = require('props'),
		ejs    = require('ejs'),
		marked = require('marked'),
		stylus = require('stylus'),
		nib    = require('nib');
		// project;

var kepler = module.exports;

/*******************************************
* Base Functionality
********************************************/

// Merges obj2 into obj1
kepler.merge = function (obj1, obj2) {
	if (Array.isArray(obj1) && Array.isArray(obj2)) {
		obj2.forEach(function(element) {
			obj1.push(element);
		});
	} else {
		for(var key in obj2) {
			obj1[key] = obj2[key];
		}
	}
	return obj1;
};

// Returns the number of top level keys in the object
// ToDo: Return the number of all of the elements in the obj.
kepler.length = function (obj) {
	var count = 0;
	for(var key in obj) {
		count++;
	}
	return count;
};

// Allows for multiple arguments to be passed to a function
// When mapping an array through the function.
// The first argument will always be the corresponding element
// in the array. Any following arguments are optional and are
// user defined
// 
// Example usage:
// kepler.map([3, 4, 22], function(element, userDefinedNumber, userDefinedNumber2) {
// 	return (element + userDefinedNumber + userDefinedNumber2);
// }, 5, 2);
// 
// Will add 5 and 2 to every element of the array. May also use
// named functions and arrays:
// 
// kepler.map(someArray, someFunction, val1, val2[, ...]);
kepler.map = function () {
	var newArr = [],
	args = arguments,
	self = args[1];
	args[0].forEach(function(element) {
		newArr.push(self.apply(self, [element].concat([].slice.call(args, 2))));
	});
	return newArr;
};

// Synchronous version of mkdir -p
// Creates a directory and if need be
// recursively creates any parent directories.
// 
// kepler.mkdirpSync(some/path/to/a/directory, 0755);
kepler.mkdirpSync = function (p, mode) {
	var status = false;
	try {
		fs.mkdirSync(p, mode);
	} catch (e) {
		status = true;
		kepler.mkdirpSync(path.dirname(p), mode);
	}
	if(status) {
		fs.mkdirSync(p, mode);
	}
};

/***************************************************************
* Default supported File Functions
****************************************************************/

// Accepts an object containing information of the corresponding file
// To see the default fileObj passed to the function view the documentation.
// 
// If a file has an extension of .md or .markdown then
// parse the file contents as markdown and change the extension
// to .html.
// 
// Returns the fileObj with updated __content and destination.
kepler.md = function (fileObj) {
	if(fileObj.extname === '.md' || fileObj.extname === '.markdown') {
		fileObj['__content'] = marked(fileObj['__content'].toString());
		// fileObj['__content'] = new Buffer(fileObj['__content']);
		fileObj.destination = path.join(path.dirname(fileObj.destination), path.basename(fileObj.destination, fileObj.extname) + '.html');
	} 
	return fileObj;
};

// Accepts an object containing information of the corresponding file
// To view the default fileObj passed to File Functions see the documentation site.
// 
// If the fileObj specifies a layout/template to use then
// merge the file contents of the template file with the current
// file, passing variables and __content of the current file to
// the template file. 
// 
// Returns the fileObj with the __contents wrapped in the contents of the template file.
kepler.template = function (fileObj) {
	var templateContents;

	if(fileObj.layout && fileObj.layoutsDirectory) {
		if(path.existsSync(path.join(fileObj.layoutsDirectory, './' + fileObj.layout + '.ejs'))) {
			templateContents = fs.readFileSync(path.join(fileObj.layoutsDirectory, './' + fileObj.layout + '.ejs'), 'utf-8');
			fileObj['__content'] = ejs.render(templateContents, {
				locals: fileObj
			});
			// fileObj['__content'] = new Buffer(fileObj['__content']);
		} else {
			throw new Error(fileObj.layout + ' does not exist');
		}
	}
	return fileObj;
};

kepler.style = function (fileObj) {
	if(fileObj['extname'] === '.styl') {
		var contents = fileObj['__content'].toString();
		stylus(contents)
			.set('filename', path.basename(fileObj['destination'], '.styl') + '.css')
			.use(nib())
			.render(function(err, css) {
				if(err) throw err;
				fileObj['__content'] = css;
				fileObj['destination'] = path.join(fileObj['destinationDirectory'], path.basename(fileObj['destination'], '.styl') + '.css' );
			});
	}
	return fileObj;
};

kepler.coffee = function (fileObj, fn) {
	if(fileObj.extname !== '.coffee') return fileObj;

	var contents = fileObj['__content'].toString();
	var command = 'coffee -ec "' + contents + '"';

	exec(command, function(error, stdout, stderr) {
		if(error) throw error;
		fileObj['__content'] = stdout;
		fileObj['destination'] = path.join(fileObj['destinationDirectory'], path.basename(fileObj['destination'], '.coffee') + '.js' );
		return fileObj;
	});
};

/*************************************************************
* Configure
**************************************************************/


// kepler.confSetup = function (conf) {
	
// 	for ( var key in conf ) {
// 		if (typeof(conf[key]) === 'object' && !Array.isArray(conf[key]) ) {
// 			var funct = kepler.confSetup(conf[key]);
// 			return function (config) {
// 				conf[key] = funct(config);
// 				return kepler.confSetup(conf)(config);
// 			};
// 		}
// 	}

// 	if ( conf['file'] ) {
// 		if ( !path.existsSync(path.resolve(conf['file'])) ) throw new Error ( 'file: ' + conf['file'] + ' does not exist in config file');
// 		return function (config) {
// 			var modules = require(path.resolve(conf['file'])),
// 					modulesObject = [];
				
// 			if ( Array.isArray(config) ) {
// 				for ( var k in modules ) {
// 					modulesObject.push(modules[k]);
// 				}
// 				return modulesObject;
// 			} else {
// 				return modules;
// 			}
// 		};
// 	}

// 	if ( conf['add'] ) {
// 		return function (config) {
// 			return kepler.merge(config, conf['add']);
// 		};
// 	}
// };

kepler.confSetup = function (value, newValue, options) {
	if( options && typeof(options) !== 'object' ) {
		throw new Error('options needs to be an object');
	}

	options = options || {};

	var keep = options['keep'] || false;
	var file = options['file'] || false;
	var outcome = options['outcome'] || 'array';

	if( !value ) {
		if ( outcome === 'array' ) {
			value = [];
		} else if ( outcome === 'object' ) {
			value = {};
		} else {
			throw new Error('outcome must either be array or object');
		}
	};

	if( file ) {
		file = path.resolve(newValue);
		if ( path.existsSync(file) ) {
			var modules = require(file),
					modulesObject;

			if ( Array.isArray(value) ) {
				modulesObject = [];
				for ( var key in modules ) {
					modulesObject.push(modules[key]);
				}
			} else {
				modulesObject = modules;
			}
			newValue = modulesObject;
		} else {
			throw new Error('File does not exists');
		}
	}

	if( keep ) {
		var index;

		if ( keep === 'all' ) {
			value = kepler.merge(value, newValue);
		} else if ( Array.isArray(keep) ) {

			if ( Array.isArray(value) ) {
				value.forEach(function(element) {
					if ( keep.indexOf(element) === -1 ) {
						index = value.indexOf(element);
						value.splice(index, 1);
					}
				});
				value = kepler.merge(value, newValue);
			} else if ( typeof(value) === 'object' && !Array.isArray(value) ) {
				for ( var key in value ) {
					if ( keep.indexOf(key) === -1 ) {
						delete value[key];
					}
				}
				value = kepler.merge(value, newValue); 
			}

		} else {
			throw new Error('keep needs to be either a string stating \'all\' or an array of values to keep');
		}

	} else {
		value = newValue;
	}

	// console.log(value);
	return value;
};

kepler.configure = function (conf) {

	var config = {},
			configValue;

	config['projectDirectory'] = path.resolve('./');
	config['destinationDirectory'] = path.join(config['projectDirectory'], './_site');
	config['layoutsDirectory'] = path.join(config['projectDirectory'], './_layouts');
	config['configFile'] = path.join(config['projectDirectory'], './_config.yml');
	config['ignoredFiles'] = ['_*', '.*', '*.log', 'node_modules', 'package.json'];
	config['fileFunctions'] = [kepler.md, kepler.template, kepler.style];
	config['ignoredRules'] = {
		'\\/' : '\\/',	
		'\\.' : '\\.',
		'\\*' : '.*'
	};

	if(!conf) {
		return config;
	}

	if(typeof(conf) === 'string' && path.existsSync(path.resolve(conf))) {
		var contents = fs.readFileSync(path.resolve(conf), 'utf-8');
		conf = props(contents);
	} else if (typeof(conf) === 'string') {
		throw new Error('Configuration file not found');
	} 

	// kepler.merge(config, conf);

	for(var key in conf) {
		if(key === 'projectDirectory') {
			config[key] = path.resolve(conf[key]);
			delete conf[key];
		}
		
		if(typeof(conf[key]) === 'object' && !Array.isArray(conf[key]) && conf[key]['value']) {
			configValue = config[key] || false;
			config[key] = kepler.confSetup(configValue, conf[key]['value'], conf[key]);
			delete conf[key];
		}
	}

	kepler.merge(config, conf);
	// console.log(config);
	return config;

};


/**************************************************************
* Start of Functions
***************************************************************/

kepler.readdir = function (dir) {
	if(!path.existsSync(dir)) throw new Error('Directory does not exist: ' + dir);
	var stats,
			newFiles;

	var files = fs.readdirSync(dir).map(function(file) {
			return path.join(dir, file);
	});

	files.forEach(function(file) {
		stats = fs.lstatSync(file);
		if(stats.isDirectory()) {
			newFiles = kepler.readdir(file);
			newFiles.forEach(function(f) {
				files.push(f);
			});
		}
	});

	return files;
};

kepler.createRegExp = function (str) {
	var reg1;
	for(var key in this) {
		reg = new RegExp(key, 'g');
		str = str.replace(reg, this[key]);
	}	
	return new RegExp(str);
};


kepler.createRegExpFunction = function (regEx) {
	return function (str) {
		return !regEx.test(str);
	};
};

kepler.createFileObj = function (file, projectDirectory, destinationDirectory, layoutsDirectory) {
	if(!path.existsSync(file)) throw new Error('File does not exist: ' + file);
	var ignoredExtensions = ['.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.tiff', '.bmp', '.css', '.coffee'],
			destination,
			desDir,
			dirName;

	var re = new RegExp(projectDirectory, 'ig');
	var results = re.exec(file);

	if(results) {
		destination = path.join(destinationDirectory, file.slice(re.lastIndex));
	} else {
		destination = path.join(destinationDirectory, file);
	}

	var stats = fs.lstatSync(file);
	var statsMethods = {
		isFile: stats.isFile(),
		isDirectory: stats.isDirectory()
	};

	if(statsMethods.isDirectory) {
		destinationDirectory = destination;
		dirName = file;
	} else {
		destinationDirectory = path.dirname(destination);
		dirName = path.dirname(file);
	}

	var pathObj = {
		dirName: dirName,
		basename: path.basename(file, path.extname(file)),
		extname: path.extname(file),
		destinationDirectory: destinationDirectory
	};

	var isIgnoredExtension = function (element) {
		return (pathObj.extname === element);
	};


	var fileObj = {};
	if(statsMethods.isFile) {
		var fileContent = fs.readFileSync(file);
		var ignored = ignoredExtensions.some(isIgnoredExtension);
		if(!ignored) {
			if(kepler.length(props(fileContent)) > 1) {
				fileObj = props(fileContent);
				if(fileObj['__content']) {
					fileObj['__content'] = new Buffer(fileObj['__content']);
				}
				// console.log(fileObj['__content']);
			} else {
				fileObj['__content'] = fileContent;
				// console.log(fileObj['__content']);
			}
		} else {
			fileObj['__content'] = fileContent;
			// console.log(Buffer.isBuffer(fileObj['__content']) + destination);
		}
	}

	fileObj['projectDirectory'] = projectDirectory;
	fileObj['destinationDirectory'] = destinationDirectory;
	fileObj['layoutsDirectory'] = layoutsDirectory;
	fileObj['destination'] = destination;

	kepler.merge(fileObj, pathObj);
	kepler.merge(fileObj, statsMethods);
	return fileObj;
};

kepler.createFile = function (fileObj) {
	var status;

	if(!path.existsSync(fileObj.destinationDirectory)) {
		kepler.mkdirpSync(fileObj.destinationDirectory, 0755);
	}

	if(fileObj.isFile) {
		fs.writeFileSync(fileObj['destination'], fileObj['__content']);
	}

	if(path.existsSync(fileObj.destination)) {
		status = fileObj.basename + fileObj.extname + ' has been created.';
	} else {
		status = fileObj.basename + fileObj.extname + ' was not created.';
	}

	return status
};

/************************************************************
* Execute the entire program
*************************************************************/

kepler.kepler = function (conf) {
	var project,
			regExpFunctions,
			outcome = [];

	project = kepler.readdir(conf['projectDirectory']);

	regExpFunctions = conf['ignoredFiles'].map(function(f) {
		return path.join(conf['projectDirectory'], f);
	}).map(kepler.createRegExp, conf['ignoredRules']).map(kepler.createRegExpFunction);

	regExpFunctions.forEach(function(funct) {
		project = project.filter(funct);
	});

	project = kepler.map(project, kepler.createFileObj, conf['projectDirectory'], conf['destinationDirectory'], conf['layoutsDirectory']);

	conf['fileFunctions'].forEach(function(funct) {
		// console.log(funct.toString());

		project.map(function(fileObj) {
		var returnObj = funct(fileObj);
		if(typeof(returnObj['__content']) === 'string' ) {
			returnObj['__content'] = new Buffer(returnObj['__content']);
		}
		return returnObj;
		});
	});

	project.forEach(function(fileObj) {
		outcome.push(kepler.createFile(fileObj));
	});

	// console.log(project);
	return outcome;
};

// console.log(kepler.kepler(config));

