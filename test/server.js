var http = require('http')
  , kepler = require('../index')
  , connect = require('connect')
  , express = require('express')
  , cons = require('consolidate')
  , app = express();

app.use(express.static('test/'));

app.use(kepler.parse('test/fixtures'));

app.use(kepler.render({
  engine: 'ejs',
  layout: 'test/layout.ejs'
}));

app.use(kepler.dirParse({
  location: 'test/fixtures'
}));

app.use(function(req, res, next) {
  if (req.kepler) {
    //cons.ejs("test/blogLayout.ejs", {files: req.kepler}, function(err, html) {
    //  if (err) return next(err);
    //  return res.end(html);
    //});

    res.end(JSON.stringify(req.kepler));
  }
});

http.createServer(app).listen(3000);
console.log('listening on port 3000');
