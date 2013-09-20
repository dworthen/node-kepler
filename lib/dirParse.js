var fs = require('fs')
  , markdown = require('markdown').markdown
  , frontMatter = require('yaml-front-matter')
  , path = require('path')
  , cache = {
  };

module.exports = function(options) { 

  return function(req, res, next){
    var url = req.url
        , dir 
        , page
        , start = 0
        , end
        , retFiles = [];
    
    if(options.limit) {
      url = req.url.slice(0, req.url.lastIndexOf('/'));
      page = parseInt(req.url.slice(req.url.lastIndexOf('/') + 1));
      start = (page - 1) * options.limit;
      end = (page * options.limit);
    }

    //console.log(url);
    //console.log(page);
    dir = path.join(options.location, url);

    fs.readdir(dir, function(err, files) {
      if (err) return next();
      
      if(!cache[dir]) {
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
        cache[dir] = retFiles;
      }

      var length = cache[dir].length;
      req.kepler = cache[dir].slice(start,end || length);
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
