# Kepler v0.2.x

#### Kepler is under heavy development and the API is subject to change.

Kepler is a collection of connect middleware designed to serve up a directory of markdown files (.md) as a blog. 

## Install

```shell
npm install kepler
```

## An Example

The following example creates a static blog server within an [Express](http://expressjs.com/) app.

```javascript
var http = require('http')
  , kepler = require('../index')
  , express = require('express');
  
app = express();

app.use(express.static('test/'));

app.use(kepler.parse('test/fixtures'));

app.use(kepler.render({
  engine: 'ejs',
  layout: 'test/layout.ejs'
}));

app.use(kepler.dirParse({
  location: 'test/fixtures',
  limit: 1, // pagination with only 1 blog entry per page.
  sort: 'date', // sort by date
  sortOrder: -1 // Desc
}));

app.use(kepler.dirRender({
  engine: 'ejs',
  layout: 'test/blogLayout.ejs'
}));

http.createServer(app).listen(3000);
console.log('listening on port 3000');
```

layout.ejs:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title></title>
  <script src="/prettyprint.js"></script>
</head>
<body>
  <h1><%= title %></h1>
  <p><%= date %></p>
  <p><%= intro %></p>
  <%- __content %>
</body>
</html>
```

blogLayout.ejs:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title></title>
</head>
<body>
    <% files.forEach(function(file) { %>
    <h2><%= file.title %></h2>
    <p><%= file.date %></p>
    <% }); %>
</body>
</html>
```

`test/fixtures` contains a `2013` directory which houses two md files with [js-yaml-front-matter](https://github.com/dworthen/js-yaml-front-matter)(optional). The md files contain yaml front matter with title and date fields:

```
---
title: "Test Site"
intro: "Intro Paragraph"
date: '07-10-2013'
---
THIS IS A TEST
==============
```

Visiting `http://localhost:3000/2013` will produce: 

```html   
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title></title>
</head>
<body>
    
    <h2>Test Site</h2>
    <p>07-10-2013</p>
    
    <h2>Z title</h2>
    <p>01-10-1990</p>
    
</body>
</html>
```

A pagination url is also available, `http://localhost:3000/2013/1` will display all the blog posts on page 1. This example is not too interesting since we are limiting each page to displaying one entry and since there are two md files then there are two pages, `/1` and `/2`.

And visiting `http://localhost:3000/2013/test` will produce:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title></title>
  <script src="/prettyprint.js"></script>
</head>
<body>
  <h1>Test Site</h1>
  <p>07-10-2013</p>
  <p>Intro Paragraph</p>
  <h1>THIS IS A TEST</h1>
</body>
</html>
```

## API - v0.2.4

### kepler.parse(location|String)

Parses a single md file that may contain [js-yaml-front-matter](https://github.com/dworthen/js-yaml-front-matter).

#### Parameters 

- `location`: where the markdown files are hosted.

The contents of markdown files will be parsed with [js-yaml-front-matter](https://github.com/dworthen/js-yaml-front-matter) and the resulting object will be added to the `req` body under the kepler property. `req.kepler.files[0].__content` will be parsed with [markdown-js](https://github.com/evilstreak/markdown-js). 

### kepler.render(options|Object)

Renders a single md file using a templating engine.

#### Parameters

- `options`: 
  - `layout`: `String` a layout template file.
  - `engine`: `String` templating engine to be used (uses [consolidate.js](https://github.com/visionmedia/consolidate.js)). 

### kepler.dirParse(options|Object)

Parses a directory of md files.

#### Parameters

- `options`:
  - `location`: `String` base directory to render md files from. Often times this will be the same location passed to `kepler.parse`.
  - `limit`: `Number` the number of blog posts to display per page.
  - `sort`: `String` the field to sort the files by. 
  - `sortOrder`: `Number` 1 for Ascending and -1 for descending.

The dirParse middleware attaches a list of files to the `req.kepler`. The files are ordered based on the sort field provided or by filename if a sort field is not provided. A `paginate` object is also created that contains information that can be used in a layout file to create a pagination functionality.

Here is an example of the type of object returned by dirParse.

```javascript
{ files:
  [ { title: 'Test Site',
      intro: 'Intro Paragraph',
      date: '07-10-2013',
      __content: '<h1>THIS IS A TEST</h1>',
      location: 'test/fixtures/2013/test.md',
      basename: 'test.md' },
    { title: 'Z title',
      intro: 'Intro Paragraph',
      date: '01-10-1990',
      __content: '<h1>THIS IS A TEST</h1>',
      location: 'test/fixtures/2013/z.md',
      basename: 'z.md' } ],
  paginate: {
    total: 2, // Total nmber of pages
    current: 1 // the current page if visiting /2013/1
  }
```

### kepler.dirRender(options|Object)

Renders a list of md files created by `kepler.dirParse` using a templating engine.

#### Parameters

- `options`: 
  - `layout`: `String` a layout template file.
  - `engine`: `String` templating engine to be used (uses [consolidate.js](https://github.com/visionmedia/consolidate.js)). 

## Running the example

```shell
git clone https://github.com/dworthen/node-kepler.git
cd node-kepler
npm install --dev
node test/server.js
```

View `http://localhost:3000/2013` to view a list of blog entries, click on a title to see a specific blog entry.

## Changelog

Version 0.2.4, dirParse no longer provides file stats.

Version >= 0.2.1 no longer renders markdown files directly but instead parses the file using js-yaml-front and markdown-js and passes the resulting object through the req body. This allows for people to write connect middleware to pre/post modify the parsed file.  

Version 0.2.x is a complete overhaul from previous versions. Previous versions were poor attempts to be a Jekyll clone. Without a clear vision or problem to solve Kepler v0.1.x was convoluted solution for producing static websites. 

Version 0.2.x points Kepler into a new direction. Kepler is no longer a tool for building static websites but is now aiming to be a simple blog generator. Kepler is a connect middleware that will serve up markdown (.md) files.

## TODO

- Document creating pagination functionality.

## License

Copyright (c) 2011 Derek Worthen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
