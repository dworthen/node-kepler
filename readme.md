# Kepler v0.2.x

#### Kepler is still very much in alpha phase and is not ready for production.

Version 0.2.x is a complete overhaul from previous versions. Previous versions were poor attempts to be a Jekyll clone. Without a clear vision or problem to solve Kepler v0.1.x was convoluted solution for producing static websites. 

Version 0.2.x points Kepler into a new direction. Kepler is no longer a tool for building static websites but is now aiming to be a simple blog generator. Kepler is a connect middleware that will serve up markdown (.md) files.

## Install

```shell
npm install kepler
```

## Usage

Kepler will parse the requested file using [js-yaml-front-matter](https://github.com/dworthen/js-yaml-front-matter) and add the object to req. the __content property on req.kepler will be parsed using [markdown-js](https://github.com/evilstreak/markdown-js).

```javascript
var http = require('http')
  , kepler = require('kepler')
  , connect = require('connect')
  , app = connect();

app.use(kepler('articles'));
app.use(function(req, res, next) {
  if(req.kepler) return res.end(kepler.__content));
  return next();
});

http.createServer(app).listen(3000);
```

### Using a template

This example uses [consolidate](https://github.com/visionmedia/consolidate.js) and the [ejs](https://github.com/visionmedia/ejs/wiki) template engine to render markdown files within a layout.

```javascript
var http = require('http')
  , kepler = require('kepler')
  , cons = require('consolidate')
  , connect = require('connect')
  , app = connect();

app.use(kepler('articles'));
// TODO: package this as a seperate middleware piece.
app.use(function(req, res, next){
  if(req.kepler) {
    cons.ejs('test/layout.ejs', req.kepler, function(err, html) {
      if (err) throw err; 
      res.end(html);
    });
  } else {
    return next();
  }
});
```

layout.ejs

```html
<h1><%= title %></h1>
<%- __content %>
<p><%= intro %></p>
<ul>
  <% list.forEach(function(item) { %>
    <li><%= item %></li>
  <% }); %>
</ul>
```

test.md file within articles/ to render

```yaml
---
title: "Test Site"
intro: "Intro Paragraph"
list:
  - one
  - two
---
THIS IS A TEST
==============
```

Will produce:

```html
<h1>Test Site</h1>
<h1>THIS IS A TEST</h1>
<p>Intro Paragraph</p>
<ul>
  
    <li>one</li>
  
    <li>two</li>
  
</ul>
```

## Changelog

Version 0.2.1 no longer renders markdown files directly but instead parses the file using js-yaml-front and markdown-js and passes the resulting object through the req body. This allows for people to write connect middleware to pre/post modify the parsed file.  

## TODO

- Kepler will become a collection of connect middleware for modifying and parsing markdown files for displaying them as a blog.
- Create a middleware to render the markdown using a predefined layout.
