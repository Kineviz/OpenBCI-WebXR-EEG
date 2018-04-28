//Loads csv files and sends data over websocket

const WebSocket = require('ws');
const path = require('path');
const _ = require('lodash');
const csv = require('csvtojson');

const config = require('./../config.js').dataPlayback;

const csvFreqPath = path.resolve(__dirname + config.freqFile);
const csvIntensePath = path.resolve(__dirname + config.intenseFile);

const fps = config.playbackRate;

let wss = null;

let freqData = {};
let intenseData = {};

function onBroadcastConnection() {
  console.log('Playback Server Connected!');
}

function onBroadcastError() {
  console.log('Playback Server Error!');
}

function onBroadcastListening() {
  console.log('Playback Server Listening!');
}

function onError(err) {
  console.log('Error: ', err);
}

function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
      }
      catch(err) {
        onError(err);
      }
      finally {}
    }
  }.bind(this));
}

function createBroadcastServer() {
    console.log('Playback Server broadasting on ' + config.ports.outgoing);
    wss = new WebSocket.Server({ port: config.ports.outgoing });
    wss.on('connection', onBroadcastConnection.bind(this));
    wss.on('error', onBroadcastError.bind(this));
    wss.on('listening', onBroadcastListening.bind(this));
  }

function startPlayback(f, i) {
  //Only start broadcasting if both files have been loaded
  if (_.size(f) > 0 && _.size(i) > 0) {
    console.log('Starting playback...');
    var fdata = f;
    var idata = i;
    var playbackInt = setInterval(() => {
      if (_.size(fdata) > 0) {
        var f1 = fdata.shift();
        var i1 = idata.shift();
        var m1 = {};
        _.each(f1, (value, key) => {
          m1[key] = {
            freq: value,
            int: i1[key],
          };
        });
        broadcast(JSON.stringify(m1));
      } else {
        clearInterval(playbackInt);
        if (config.loop) {
          console.log('Looping...');
          startPlayback(_.clone(freqData), _.clone(intenseData));
        }
      }
    }, 1000 / fps); //How often to broadcast data
  }
}

//Load CSV Files
csv()
.fromFile(csvFreqPath)
.on('end_parsed',(jsonArrObj)=>{
  freqData = jsonArrObj;
  console.log(_.size(freqData), ' frequency records');
  if (config.autoplay) {
    startPlayback(_.clone(freqData), _.clone(intenseData));
  }
});

csv()
.fromFile(csvIntensePath)
.on('end_parsed',(jsonArrObj)=>{
  intenseData = jsonArrObj;
  console.log(_.size(intenseData), ' intensity records');
  if (config.autoplay) {
    startPlayback(_.clone(freqData), _.clone(intenseData));
  }
});

//Start websocket server
createBroadcastServer();
