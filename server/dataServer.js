//Stream data to client browser

var express = require('express');

var config = require('./config.js');

var app = express(function(err) {
	console.log(err);
});

//Custom csv streamer
if (config.dataPlayback.enabled) {
	app.locals.dataPlayback = require('./playback/dataStreamer');
}

//Open BCI
app.locals.openbci = {};

if (config.openbci.cyton.enabled) {
	app.locals.openbci.cyton = require('./openbci/cyton');
}

if (config.openbci.ganglion.enabled) {
	app.locals.openbci.ganglion = require('./openbci/ganglion');
}

//Start data server
var server = app.listen(config.server.port, function() {
	console.log('Data server started on port', server.address().port);
});
