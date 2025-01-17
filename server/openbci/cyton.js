var config = require('./../config.js').openbci.cyton;

const Cyton = require('openbci').Cyton;
let ourBoard = new Cyton({
  debug: config.debug,
  verbose: config.verbose
});

ourBoard.autoFindOpenBCIBoard().then(portName => {
  if (portName) {
    /**
     * Connect to the board with portName
     * Only works if one board is plugged in
     * i.e. ourBoard.connect(portName).....
     */
    ourBoard.connect(portName) // Port name is a serial port name, see `.listPorts()`
      .then(() => {
        ourBoard.on('ready', () => {
          ourBoard.syncRegisterSettings()
            .then((cs) => {
              return ourBoard.streamStart();
            })
            .catch((err) => {
              console.log('err', err);
              return ourBoard.streamStart();
            })
            .catch((err) => {
              console.log('fatal err', err);
              process.exit(0);
            });

          ourBoard.on('sample', (sample) => {
            /** Work with sample */
            for (let i = 0; i < ourBoard.numberOfChannels(); i++) {
              console.log(`Channel ${(i + 1)}: ${sample.channelData[i].toFixed(8)} Volts.`);
              // prints to the console
              //  "Channel 1: 0.00001987 Volts."
              //  "Channel 2: 0.00002255 Volts."
              //  ...
              //  "Channel 8: -0.00001875 Volts."
            }
          });
        });
      });
  } else {
    /** Unable to auto find OpenBCI board */
    console.log('Unable to auto find OpenBCI board');
  }
});

function exitHandler (options, err) {
  if (options.cleanup) {
    if (verbose) console.log('clean');
    ourBoard.removeAllListeners();
    /** Do additional clean up here */
  }
  if (err) console.log(err.stack);
  if (options.exit) {
    if (verbose) console.log('exit');
    ourBoard.disconnect().catch(console.log);
  }
}

if (process.platform === 'win32') {
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', function () {
    process.emit('SIGINT');
  });
}

// do something when app is closing
process.on('exit', exitHandler.bind(null, {
  cleanup: true
}));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
  exit: true
}));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {
  exit: true
}));
