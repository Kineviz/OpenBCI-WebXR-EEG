//Store server config values here

const config = {
  dataPlayback: {
    enabled: true,
    freqFile: './../../data/fftcenter.csv',
    intenseFile: './../../data/fftpower.csv',
    playbackRate: 10, //FPS
    autoplay: true,
    loop: true,
    ports: {
      outgoing: 9999
    }
  },
  openbci: {
    cyton: {
      enabled: false,
      debug: false,
      verbose: true,
    },
    ganglion: {
      enabled: false,
      debug: false,
      verbose: true,
      impedance: false,
      accel: false,
    },
  },
  server: {
    port: 9000,
  },
  app: {
    port: 8080,
  },
  favicon: __dirname + './../dist/images/favicon.ico',
  copy: {
    html: {
      src: './src/html/index.html',
      dest: './dist/index.html',
    },
    fonts: {
      src: './src/fonts',
      dest: './dist/fonts',
    },
    images: {
      src: './src/images',
      dest: './dist/images',
    },
    models: {
      src: './src/models',
      dest: './dist/models',
    },
    textures: {
      src: './src/textures',
      dest: './dist/textures',
    },
  },
};

module.exports = config;
