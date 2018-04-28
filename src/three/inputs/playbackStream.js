
class PlaybackStream {
  constructor(url, callback) {
    this.callback = callback;
    this.websocket = null;
    this.initializeWebSocket(url);
  }

  initializeWebSocket(url) {
    console.log('Playback Stream connecting to: ', url);

    this.websocket = new WebSocket(url);
    this.websocket.onopen = this.onOpen.bind(this);
    this.websocket.onclose = this.onClose.bind(this);
    this.websocket.onmessage = this.onMessage.bind(this);
    this.websocket.onerror = this.onError.bind(this);

    // stop Chrome from ruining things and crashing the socket server
    window.addEventListener('beforeunload', () => {
      this.websocket.close();
    });
  }

  onOpen(evt) {
    console.log('Playback Stream connected:', evt);
  }

  onClose(evt) {
    console.log('Playback Stream  disconnected:', evt);
  }

  onMessage(msg) {
    this.callback(JSON.parse(msg.data));
    // console.log(msg);
  }

  onError(evt) {
    console.log('Playback Stream  error:', evt);
  }
}

module.exports = PlaybackStream;
