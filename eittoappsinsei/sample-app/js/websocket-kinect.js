(function() {
    $(function () {
        
    var connect, currentOutArrayIdx, dataCallback, k;
    params = {
      stats: 0,
      fog: 1,
      credits: 1,
      ws: "ws://192.168.1.69:9000"
    };
    wls = window.location.search;
    _ref = wls.substring(1).split('&');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      kvp = _ref[_i];
      _ref2 = kvp.split('='), k = _ref2[0], v = _ref2[1];
      params[k] = k === 'ws' ? v : parseInt(v);
    }
    outArrays = (function() {
      var _results;
      _results = [];
      for (i = 0; i <= 1; i++) {
        _results.push(new Uint8Array(new ArrayBuffer(1024)));
      }
      return _results;
    })();
    _ref4 = [0, 1], currentOutArrayIdx = _ref4[0], prevOutArrayIdx = _ref4[1];
    dataCallback = function(e) {
      var pos;
      inStream = LZMA.wrapArrayBuffer(new Uint8Array(e.data));
      outStream = LZMA.wrapArrayBuffer(outArrays[currentOutArrayIdx]);
      LZMA.decompress(inStream, inStream, outStream, 1024);
      bytes = outStream.data;
      pos = bytes[0] - 100;
      console.log(pos);
      move(pos);
    };
    connect = function() {
      var reconnectDelay, ws;
      reconnectDelay = 10;
      console.log("Connecting to " + params.ws + " ...");
      ws = new WebSocket(params.ws);
      ws.binaryType = 'arraybuffer';
      seenKeyFrame = false;
      ws.onopen = function() {
        return console.log('Connected');
      };
      ws.onclose = function() {
        console.log("Disconnected: retrying in " + reconnectDelay + "s");
        return setTimeout(connect, reconnectDelay * 1000);
      };
      return ws.onmessage = dataCallback;
    };
    return connect();
  });

}).call(this);
