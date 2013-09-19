# Kepler v0.2.x

#### Kepler is under heavy development, the API is subject to change.

Kepler is a collection of connect middleware designed to serve up a directory of markdown files (.md) as a blog. 

## Install

```shell
npm install kepler
```

## Usage - v0.2.3

The main middleware piece to kepler is the parser. Keplers parser will parse the requested file using [js-yaml-front-matter](https://github.com/dworthen/js-yaml-front-matter) and add the object to req. the __content property on req.kepler will be parsed using [markdown-js](https://github.com/evilstreak/markdown-js).

```javascript
var http = require('http')
  , kepler = require('kepler')
  , connect = require('connect')
  , app = connect();

app.use(kepler.parse('articles'));
app.use(function(req, res, next) {
  // req.kepler.__content will have the heart of the .md file
  if(req.kepler) return res.end(kepler.__content));
  return next();
});

http.createServer(app).listen(3000);
```

If the markdown file being rendered contains

```yaml
---
title: "Website"
list:
  - one
  - two
----
# Body!
```

then `req.kepler` will be

```javascript
{
  title: "website",
  list: ["one", "two"]
  __content: "<h1>Body!</h1>'
}
```

### Using a template

This example uses the kepler render middleware which utilizes [consolidate.js](https://github.com/visionmedia/consolidate.js) for rendering predefined layout files.

```javascript
var http = require('http')
  , kepler = require('kepler')
  , connect = require('connect')
  , app = connect();

app.use(kepler('articles'));
app.use(kepler.parse({
  engine: 'ejs',
  layout: 'layout.ejs'
});

http.createServer(app).listen(3000);
console.log('listening on port 3000');
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

articles/test.md

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

### Displaying a list of blog entries

This example uses a piece of middleware for displaying a directory of markdown files as list of blog entries. The example uses [express](http://expressjs.com/).

```javascript
var http = require('http')
  , kepler = require('kepler')
  , express = require('express')
  , cons = require('consolidate')
  , app = express();

app.use(express.static('test/'));

// Single file parsing and rendering
app.use(kepler.parse('test/fixtures'));

app.use(kepler.render({
  engine: 'ejs',
  layout: 'test/layout.ejs'
}));

// Directory rendering
app.use(kepler.dirParse({
  location: 'test/fixtures'
}));

//TODO: Create a piece of middleware to render the list of files.
app.use(function(req, res, next) {
  if (req.kepler) {
    cons.ejs("test/blogLayout.ejs", {files: req.kepler}, function(err, html) {
      if (err) return next(err);
      return res.end(html);
    });
  }
});

http.createServer(app).listen(3000);
console.log('listening on port 3000');
```

blogLayout.ejs

```javascript
<% files.forEach(function(file) { %>
<h2><%= file.file.title %></h2>
<p><%= file.ctime %></p>
<% }); %>
```

The layout expects the markdown files to at least have a title attribute.

```yaml
---
title: "Blog Title"
---
### content
```

The dirParse middleware attaches a list of files in a directory to the req body under the kepler property. The files are ordered based on when the were last edited, the most recently edited file being first.

Each object in the list has access to the file [stats](http://nodejs.org/api/fs.html#fs_class_fs_stats). Here is an example of the type of object returned by dirParse.

```javascript
[
{"dev":2054,
"mode":33204,
"nlink":1,
"uid":1000,
"gid":1000,
"rdev":0,
"blksize":4096,
"ino":3021542,
"size":104,
"blocks":8,
"atime":"2013-09-18T22:37:58.000Z",
"mtime":"2013-09-17T06:19:30.000Z",
"ctime":"2013-09-17T06:19:30.000Z",
"file":
  {
    "title":"Test Site",
    "intro":"Intro Paragraph",
    "list":["one","two"],
    "__content":"<h1>THIS IS A TEST</h1>",
    "location":"test/fixtures/2013/test.md"
  }
}
]
```

## Running the example

```shell
git clone https://github.com/dworthen/node-kepler.git
cd node-kepler
npm install --dev
node test/server.js
```

## Changelog

Version >= 0.2.1 no longer renders markdown files directly but instead parses the file using js-yaml-front and markdown-js and passes the resulting object through the req body. This allows for people to write connect middleware to pre/post modify the parsed file.  

Version 0.2.x is a complete overhaul from previous versions. Previous versions were poor attempts to be a Jekyll clone. Without a clear vision or problem to solve Kepler v0.1.x was convoluted solution for producing static websites. 

Version 0.2.x points Kepler into a new direction. Kepler is no longer a tool for building static websites but is now aiming to be a simple blog generator. Kepler is a connect middleware that will serve up markdown (.md) files.

## TODO

- Kepler will become a collection of connect middleware for modifying and parsing markdown files for displaying them as a blog.
- Create a middleware to render the markdown using a predefined layout.
