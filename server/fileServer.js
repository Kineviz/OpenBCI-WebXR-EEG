// Static file server.
var express = require('express');

var config = require('./config.js');

var prodDir = 'dist';
var app = express();

app.use(express.static(prodDir));

var server = app.listen(config.app.port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('File server running at http://%s:%s', host, port);
});