var http = require('http')
  , kepler = require('../index')
  , connect = require('connect')
  , app = connect();

app.use(kepler('test/fixtures'));

http.createServer(app).listen(3000);
