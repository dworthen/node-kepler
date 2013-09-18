var cons = require('consolidate');

module.exports = function(options) { 

  return function(req, res, next){
    if(req.kepler && options && options.layout) {
      cons[options.engine](options.layout, req.kepler, function(err, html) {
        if (err) throw err; 
        return res.end(html);
      });
    } else {
      return next();
    }
  };

};
