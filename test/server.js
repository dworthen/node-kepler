var http = require('http')
  , kepler = require('../index')
  , connect = require('connect')
  , cons = require('consolidate')
  , app = connect();

app.use(kepler.parse('test/fixtures'));
app.use(kepler.render({
  engine: 'ejs',
  layout: 'test/layout.ejs'
}));
//app.use(function(req, res, next){
//  if(req.kepler) {
//    console.log(req.kepler);
//    cons.ejs('test/layout.ejs', req.kepler, function(err, html) {
//      if (err) throw err; 
//      res.end(html);
//    });
//  } else {
//    return next();
//  }
//});

http.createServer(app).listen(3000);
console.log('listening on port 3000');
