#!/usr/bin/env node

/*************************************
* Resolving dependencies
**************************************/
var program    = require('commander'),
		server     = require('connect'),
		kepler     = require('../lib/kepler'),
		path       = require('path'),
		fs         = require('fs'),
		stylus     = require('stylus'),
		nib        = require('nib'),
		configFile = kepler.getConfigFile(),
		config     = kepler.configure(configFile),
		results;

/************************************************
* Functions
*************************************************/

var setProject = function (dir) {
	config = kepler.setProjectDirectory(dir);
};

var setDesDir = function (dir) {
	config['destinationDirectory'] = kepler.setDestinationDirectory(dir);
};

var setStylus = function (dir) {
	config['stylus'] = kepler.setStylus(dir);
};

var setConfig = function (file) {
	configFile = kepler.setConfigFile(file);
	config = kepler.configure(configFile);
};

var compile = function (conf) {
	results = kepler.kepler(conf);
};

program
  .version('0.1.0')
  .usage('[options] [commands]')	
  .option('-p --project <directory>', 'choose the project directory. [./]', setProject, './')
  .option('-d --destination <directory>', 'Sets the compiled directory, relative to the project directory [./_site/].', setDesDir, './_site/')
  .option('-s --stylus <directory>', 'Sets the directory containing stylus files. [./styles/]', setStylus, './styles/')
  .option('-S --silent', 'Use Kepler in silent mode')
  .option('-c --config <file>', 'Sets the configuration file. [./_config.yml]', setConfig, './_config.yml')

program
	.command('compile')
	.description('compile the source directory to the destination directory.')
	.action(function() {
		compile(config);
	});

program
	.command('server [port]')
	.description('Start a server listening on the supplied port [3000]')
	.action(function(port) {
		port = port || 3000;
		compile(config);
		server.createServer()
			.use(server.favicon())
			.use(server.static(config['destinationDirectory']))
			.listen(port);
		console.log('server is listening on port ' + port);
	});

program.parse(process.argv);

if(!program.silent) {
	console.log(results);
}
