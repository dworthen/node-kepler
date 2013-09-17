//var DirMapper = require('dir-mapper')
//  , dirMapper = new DirMapper()
var path = require('path')
  , fs = require('fs')
  , markdown = require('markdown').markdown
  , frontMatter = require('yaml-front-matter');

var kepler = module.exports = function(loc) {
  var dir = path.normalize(loc)
    , spliceLength;

  dir = dir.charAt(0) == '.' ? dir.slice(3) : dir;
  spliceLength = dir.split('/').length + 1;
  
  return function(req, res, next) {
    var root = new RegExp('\^/' + dir + '/?', 'i')
      , url = req.url
      , file = path.join(dir, url + '.md')
      , subDirs;
    
  fs.readFile(file, function(err, file) {
      if (err) return next();
      file = frontMatter.loadFront(file.toString());
      file.__content = markdown.toHTML(file.__content);
      req.kepler = file;
      return next();
    });
  }
};

