var https = require('https');
var WebSocket = require('ws');
var ServerError = require('../utils/server_error');
var CommonError = require('../constants/error_constants').COMMON;

function SocketManager() {
  this.pendingClients = [];
  this.msgHandlers = {};
  WebSocket.prototype.sendObj = function (obj) {
    if (obj) {
      this.send(JSON.stringify(obj));
    }
  };
}

SocketManager.prototype.addHandler = function(handler) {
  var self = this;
  Object.keys(handler).forEach(function (type) {
    self.msgHandlers[type] = handler[type];
  });
};

SocketManager.prototype.start = function (port, options) {
  if (!this.serverSocket) {
    this.port = port;
    this.options = options;
    this.server = https.createServer(this.options);
    this.serverSocket = new WebSocket.Server({ server: this.server })
  }
  var self = this;
  this.server.listen(this.port, function () {
    console.log('listenning port ' + self.port);
  });
  this.serverSocket.on('connection', function(ws, req) {
    self.pendingClients.push(ws);
    ws.on('message', function (msg) {
      var req;
      try {
        req = JSON.parse(msg);
      } catch (error) {
        console.log(error);
      }
      if (!req || !req.hasOwnProperty('type')) {
        ws.sendObj({
          error: {
            code: 1,
            msg: 'invalid request'
          }
        });
        return;
      }
      if (!self.msgHandlers.hasOwnProperty(req.type)) {
        ws.sendObj({
          error: {
            code: 1,
            msg: 'unknown request'
          }
        });
        return;
      }
      try {
        self.msgHandlers[req.type](ws, req.data);
      } catch (error) {
        if (error instanceof ServerError) {
          console.log(error.code + ':' + error.msg);
          ws.sendObj({
            error: {
              code: error.code,
              msg: error.msg
            }
          });
        } else {
          console.log(error);
          ws.sendObj({
            error: {
              code: CommonError.INTERNAL_ERROR,
              msg: error.msg
            }
          });
        }
      }
    });
  });
};

module.exports = function () {
  var instance;
  return {
    getInstance: function () {
      if (!instance) {
        instance = new SocketManager();
      }
      return instance;
    }
  };
}();