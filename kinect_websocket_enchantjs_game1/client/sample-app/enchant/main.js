enchant();
window.onload = function () {
    console.log('hello enchant.js');
    var game = new Game(320, 320);
    game.preload('i.png', 'c.png', 'e.png', '4.png');
    game.onload = function(){
        var back = new Sprite(320, 320);
        back.image = game.assets['e.png'];

        back.addEventListener('enterframe', function(){
            this.y += 3 + (game.frame / 100);
            if(this.y > 320){
                this.y = -320;
            }
        });
        game.rootScene.addChild(back);
        
        var car = new Sprite(32, 32);
        car.image = game.assets['4.png'];
        car.x = 160;
        car.y = 280;
        game.rootScene.addChild(car);
        
        game.rootScene.addEventListener('touchmove', function(e){
            car.x = (2 * car.x + e.x) / 3;
        });
        game.rootScene.move = function (pos) {
            car.x -= pos;
            if (car.x < 0) {
                car.x = 0;
            }
            if (car.x > 320) {
                car.x = 320;
            }
        }
        game.rootScene.addEventListener('enterframe', function(){
            if(Math.random() < 0.05){
                var bear = new Sprite(32, 32);
                bear.image = game.assets['c.png'];
                bear.x = Math.random() * 320;
                bear.frame = 15;
                if (Math.random() < 0.5) {
                    bear.frame = 16;
                }
                bear.y = -32;
                bear.addEventListener('enterframe', function(){
                    this.y += 3 + (game.frame / 100);
                    if(this.within(car, 20)){
                        this.frame = 18;
                        game.end();
                    }
                });
                game.rootScene.addChild(bear);
            }
        });
    }
    game.start();

        var messageWebSocket;
        var messageWriter;

        function startSend() {

            if (!messageWebSocket) {
                // Set up the socket data format and callbacks
                var webSocket = new Windows.Networking.Sockets.MessageWebSocket();
                // Both utf8 and binary message types are supported. If utf8 is specified then the developer
                // promises to only send utf8 encoded data.
                webSocket.control.messageType = Windows.Networking.Sockets.SocketMessageType.utf8;
                webSocket.onmessagereceived = onMessageReceived;
                webSocket.onclosed = onClosed;

                // By default 'serverAddress' is disabled and URI validation is not required. When enabling the
                // text box validating the URI is required since it was received from an untrusted source (user
                // input). The URI is validated by calling validateAndCreateUri() that will return 'null' for
                // strings that are not valid WebSocket URIs.
                // Note that when enabling the text box users may provide URIs to machines on the intrAnet
                // or intErnet. In these cases the app requires the "Home or Work Networking" or
                // "Internet (Client)" capability respectively.
                var uri = validateAndCreateUri("ws://192.168.1.69:9000");
                if (!uri) {
                    return;
                }

                
                webSocket.connectAsync(uri).done(function () {


                    messageWebSocket = webSocket;
                    // The default DataWriter encoding is utf8.
                    messageWriter = new Windows.Storage.Streams.DataWriter(webSocket.outputStream);
                    sendMessage();

                }, function (error) {
                    var errorStatus = Windows.Networking.Sockets.WebSocketError.getStatus(error.number);
                    if (errorStatus === Windows.Web.WebErrorStatus.cannotConnect ||
                        errorStatus === Windows.Web.WebErrorStatus.notFound ||
                        errorStatus === Windows.Web.WebErrorStatus.requestTimeout) {
                    }
                    else {
                    }
                });
            }
            else {
                sendMessage();
            }
        }

        function onMessageReceived(args) {
            // The incoming message is already buffered.
            if (args) {
                var dataReader = args.getDataReader();
                log("Message Received; Type: " + getMessageTypeName(args.messageType)
                    + ", Bytes: " + dataReader.unconsumedBufferLength + ", Text: ");
                var str = dataReader.readString(dataReader.unconsumedBufferLength);
                game.rootScene.move(parseInt(str));
            }
        }

        function getMessageTypeName(messageType) {
            switch (messageType) {
                case Windows.Networking.Sockets.SocketMessageType.utf8:
                    return "UTF-8";
                case Windows.Networking.Sockets.SocketMessageType.binary:
                    return "Binary";
                default:
                    return "Unknown";
            }
        }

        function sendMessage() {
            log("Sending message");
            messageWriter.writeString("sendMessage");
            messageWriter.storeAsync().done("", sendError);
        }

        function sendError(error) {
            log("Send error: " + getError(error));
        }

        function onClosed(args) {
            log("Closed; Code: " + args.code + " Reason: " + args.reason);
            if (!messageWebSocket) {
                return;
            }

            closeSocketCore();
        }

        function closeSocket() {
            if (!messageWebSocket) {
                return;
            }
            
            closeSocketCore(1000, "Closed due to user request.");
        }

        function closeSocketCore(closeCode, closeStatus) {
            if (closeCode && closeStatus) {
                messageWebSocket.close(closeCode, closeStatus);
            } else {
                messageWebSocket.close();
            }

            messageWebSocket = null;

            if (messageWriter) {
                messageWriter.close();
                messageWriter = null;
            }
        }

        function log(text) {
            //        document.getElementById("outputField").innerHTML += text + "<br>";
        }

        startSend();

}

window.addEventListener('message', function (e) {
    console.log(e);
});