var DirMapper = require('dir-mapper')
  , dirMapper = new DirMapper()
  , path = require('path')
  , fs = require('fs')
  , markdown = require('markdown').markdown;

var kepler = module.exports = function(loc) {
  var dir = path.normalize(loc)
    , spliceLength;

  dir = dir.charAt(0) == '.' ? dir.slice(3) : dir;
  spliceLength = dir.split('/').length + 1;

  return function(req, res, next) {
    var root = new RegExp('\^/' + dir + '/?', 'i')
      , url = req.url
      , subDirs
      , file;
    
    if(root.test(url)) {
      subDirs = url.split('/');
      subDirs.splice(0,spliceLength);
      file = path.resolve(loc + '/' + subDirs.join('-') + '.md');
      // console.log(file);
      fs.readFile(file, function(err, file) {
        if (err) return next();
        res.end(markdown.toHTML(file.toString()));
      });
    } else {
      return next();
    }
  }
};

