var http = require('http')
  , kepler = require('../index')
  , connect = require('connect')
  , express = require('express')
  , cons = require('consolidate');
  
app = express();

app.use(express.static('test/'));

app.use(kepler.parse('test/fixtures'));

app.use(kepler.render({
  engine: 'ejs',
  layout: 'test/layout.ejs'
}));

app.use(kepler.dirParse({
  location: 'test/fixtures',
  limit: 1,
  sort: 'date', // sort by date
  sortOrder: -1 // Desc
}));

app.use(function(req, res, next) {
  console.log(req.kepler);
  next();
});

app.use(kepler.dirRender({
  engine: 'ejs',
  layout: 'test/blogLayout.ejs'
}));

http.createServer(app).listen(3000);
console.log('listening on port 3000');
