//Store client config values here

import config from './../../server/config';

const defaults = {
  debug: true, //Includes stats and helpers
  dataPlayback: {
    ports: {
      outgoing: config.dataPlayback.ports.outgoing,
    },
  },
};

module.exports = defaults;
