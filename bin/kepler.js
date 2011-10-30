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

// Compiles the project
var compile = function () {
	// kepler.resolvePaths();
	kepler.readProject();
	kepler.createDestination();
};


program
  .version('0.0.1')
  .usage('[options] [commands]')	
  .option('-l --location <directory>', 'choose the source directory. [./]', setLocation, './')
  .option('-d --destination <directory>', 'Set the destination directory, relative to the source directory, for the compiled project [./_site/].', setDes, './_site/')
  // .option('-s --stylus [directory]', 'Uses stylus', setStylus, './styles/')
  .option('--layout <directory>', 'Set the layouts directory relative to the source directory. [./_layouts/]')
  .option('--posts <directory>', 'Set the posts source directory relative to teh source directory. [./_posts/]')
  .option('--posts-destination <directory>', 'Set the destination directory of the posts relative to the destination directory [./_site/]');

program
	.command('compile')
	.description('compile the source directory to the destination directory')
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


