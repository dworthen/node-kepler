var fs = require('fs')
  , markdown = require('markdown').markdown
  , frontMatter = require('yaml-front-matter')
  , path = require('path');

module.exports = function(options) { 

  return function(req, res, next){
    var dir = path.join(options.location, req.url),
        retFiles = [];

    fs.readdir(dir, function(err, files) {
      if (err) return next();
      var filesLeft = files.length;
 
      for(var i = 0; i < files.length; i++) {
        var file = path.join(dir, files[i])
          , stats;
        
        stats = fs.statSync(file);
        stats.file = frontMatter.loadFront(fs.readFileSync(file).toString());
        stats.file.__content = markdown.toHTML(stats.file.__content);
        stats.file.location= file;
        retFiles.push(stats);
      }
      retFiles = sortFiles(retFiles);
      req.kepler = retFiles;
      return next();
    });
  };

};

function sortFiles(files) {
  var array = files.slice();

  return array.sort(function(a, b) {
    return a.ctime.getTime() > b.ctime.getTime() ? -1 : 1;
  });
} 
