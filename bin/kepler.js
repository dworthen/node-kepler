#!/usr/bin/env node

/*************************************
* Resolving dependencies
**************************************/
var program   = require('commander'),
		server    = require('connect'),
		kepler    = require('../lib/kepler'),
		path 			= require('path'),
		fs 				= require('fs'),
		stylus    = require('stylus'),
		nib				= require('nib'),
		useStylus = false,
		des       = kepler.getDes();
		kepler.checkForConfigFile();

// Sets the location for the project
var setLocation = function (location) {
	kepler.setDir(location);
};

// Sets the destination for where to compile the project too.
var setDes = function (location) {
	kepler.setDestination(location);
	des = kepler.getDes();
};

var setStylus = function (dir) {
	kepler.setStylus(dir);
	useStylus = kepler.getStylus();
};

// Compiles the project
var compile = function () {
	// console.log(useStylus);
	if(useStylus) {
		var stylusFiles = kepler.readProject(useStylus);
		kepler.addIgnoredFiles(['*.styl']);
	}

	kepler.readProject();
	kepler.createDestination();

	// Stylus support
	if(stylusFiles) {
		stylusFiles.forEach(function (file) {
			var stats = fs.lstatSync(file);
			if(!stats.isDirectory()) {
				if(path.extname(file) === '.styl') {
					var fileContents = fs.readFileSync(file, 'utf-8');
					stylus(fileContents)
						.set('filename', path.basename(file, '.styl') + '.css')
						.use(nib())
						.render(function(err, css) {
							if (err) console.error(err);
							fs.writeFileSync(path.join(des, path.basename(useStylus), path.basename(file, '.styl') + '.css'), css);
						});
				}
			}
		});	
	}
};


program
  .version('0.0.11')
  .usage('[options] [commands]')	
  .option('-p --project <directory>', 'choose the project directory. [./]', setLocation, './')
  .option('-d --destination <directory>', 'Sets the compiled directory, relative to the project directory [./_site/].', setDes, './_site/')
  .option('-s --stylus <directory>', 'Sets the directory containing stylus files. [./styles/]', setStylus, './styles/')
  .option('--layouts <directory>', 'Sets the layouts directory containing .ejs templates. [./_layouts/]')
  .option('--posts <directory>', 'Sets the posts directory containing posts pre-compiled. [./_posts/]')
  .option('--posts-destination <directory>', 'Sets the destination directory of the posts relative to the destination directory [./_site/]');

program
	.command('compile')
	.description('compile the source directory to the destination directory, this command is equivalent to running kepler without any options')
	.action(compile);

program
	.command('server [port]')
	.description('Start a server listening on the supplied port [3000]')
	.action(function(port) {
		port = port || 3000;
		compile();
		server.createServer()
			.use(server.favicon())
			.use(server.static(des))
			.listen(port);
		console.log('server is listening on port ' + port);
	});

program.parse(process.argv);

compile();


