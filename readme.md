# Kepler v0.2.0

Version 0.2.0 is a complete overhaul from previous versions. Previous versions were poor attempts to be a Jekyll clone. Without a clear vision or problem to solve Kepler v0.1.x was convoluted solution for producing static websites. 

Version 0.2.0 points Kepler into a new direction. Kepler is no longer a tool for building static websites but is now aiming to be a simple blog generator. 

## Install

```shell
npm install kepler
```

## Usage

```javascript
var http = require('http')
  , kepler = require('../index')
  , connect = require('connect')
  , app = connect();

app.use(kepler('articles'));

http.createServer(app).listen(3000);
```
