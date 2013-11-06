var fs = require('fs')
  , markdown = require('markdown').markdown
  , frontMatter = require('yaml-front-matter')
  , path = require('path')
  , cache = {
  };

module.exports = function(options) { 

  function sortFiles(files) {
    var array = files.slice();

    return array.sort(function(a, b) {
      return a[options.sort || 'basename'] > b[options.sort || 'basename'] 
      ? (options.sortOrder || 1)
      : (-options.sortOrder || -1);
    });
  } 

  return function(req, res, next){
    var url = req.url
        , dir 
        , page
        , start = 0
        , end
        , paginate = {}
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
            , fileObj
            , stats;
          
          stats = fs.statSync(file);
          if(stats.isFile()) {
            fileObj = frontMatter.loadFront(fs.readFileSync(file).toString());
            fileObj.__content = markdown.toHTML(fileObj.__content);
            fileObj.location= file;
            fileObj.basename = path.basename(file);
            retFiles.push(fileObj);
          }
        }
        retFiles = sortFiles(retFiles);
        cache[dir] = retFiles;
      }

      var length = cache[dir].length;
        //, total = options.limit ? Math.ceil(length / options.limit) : 1
        //, current = options.limit ? page : 1;

      req.kepler = {};
      req.kepler.files = cache[dir].slice(start,end || length);
      req.kepler.paginate = {
        total : options.limit ? Math.ceil(length / options.limit) : 1,
        current : options.limit ? page : 1
      };
      return next();
    });
  };

};

