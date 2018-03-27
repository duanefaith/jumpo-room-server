var WebSocket = require('ws');
var ServerError = require('../utils/server_error');
var CommonError = require('../constants/error_constants').COMMON;
const RespConstants = require('../constants/resp_constants');

function SocketManager() {
  this.clients = {};
  this.msgHandlers = {};
  WebSocket.prototype.sendObj = function (obj) {
    if (obj) {
      try {
        if (this.readyState === WebSocket.OPEN) {
          this.send(JSON.stringify(obj));
        } else {
          console.warn('state invalid in ' + this.readyState + ', sending ' + JSON.stringify(obj) + ' abort');
        }
      } catch (error) {
        console.warn(error);
      }
    }
  };
  WebSocket.prototype.sendResp = function (req, obj) {
    this.sendObj({
      type: RespConstants.RESP_TYPE_NORMAL,
      req: req,
      result: obj
    })
  };
}

SocketManager.prototype.addHandler = function(handler) {
  var self = this;
  Object.keys(handler).forEach(function (type) {
    self.msgHandlers[type] = handler[type];
  });
};

SocketManager.prototype.start = function (port, options = null) {
  if (!this.serverSocket) {
    this.port = port;
    this.options = options;
    if (this.options) {
      var https = require('https');
      this.server = https.createServer(this.options);
    } else {
      var http = require('http');
      this.server = http.createServer();
    }
    this.serverSocket = new WebSocket.Server({ server: this.server })
  }
  var self = this;
  this.server.listen(this.port, function () {
    console.log('listenning port ' + self.port);
  });
  this.serverSocket.on('connection', function(ws, req) {
    ws.on('message', function (msg) {
      var req;
      try {
        req = JSON.parse(msg);
      } catch (error) {
        console.warn(error);
      }
      if (!req || !req.hasOwnProperty('type')) {
        this.sendResp(req, {
          error: {
            code: 1,
            msg: 'invalid request'
          }
        });
        return;
      }
      if (!self.msgHandlers.hasOwnProperty(req.type)) {
        this.sendResp(req, {
          error: {
            code: 1,
            msg: 'unknown request'
          }
        });
        return;
      }
      try {
        self.msgHandlers[req.type](this, req.data, req);
      } catch (error) {
        if (error instanceof ServerError) {
          console.warn(error.code + ':' + error.msg);
          this.sendResp(req, {
            error: {
              code: error.code,
              msg: error.msg
            }
          });
        } else {
          console.warn(error);
          this.sendResp(req, {
            error: {
              code: CommonError.INTERNAL_ERROR,
              msg: error
            }
          });
        }
      }
    });

    ws.on('close', function (code, reason) {
      var key;
      var allKeys = Object.keys(self.clients);
      for (var i = 0; i < allKeys.length; i ++) {
        if (self.clients[allKeys[i]] === this) {
          key = allKeys[i];
          break;
        }
      }
      if (key) {
        delete self.clients[key];
      }
    });
  });
};

SocketManager.prototype.associate = function (player, ws) {
  if (player && ws) {
    var oldWs = this.clients[player.getId()];
    if (oldWs) {
      if (oldWs !== ws) {
        oldWs.close();
      }
    }
    this.clients[player.getId()] = ws;
  }
};

SocketManager.prototype.disAssociate = function (player) {
  if (player) {
    var ws = this.clients[player.getId()];
    if (ws) {
      ws.close();
    }
    delete this.clients[player.getId()];
  }
};

SocketManager.prototype.broadcastToPlayers = function (players, msgObj) {
  var self = this;
  players.forEach(function (player) {
    var ws = self.clients[player.getId()];
    if (ws) {
      ws.sendObj({
        type: RespConstants.RESP_TYPE_PUSH,
        data: msgObj
      });
    }
  });
};

SocketManager.prototype.broadcastToPlayerIds = function (playerIds, msgObj) {
  var self = this;
  playerIds.forEach(function (playerId) {
    var ws = self.clients[playerId];
    if (ws) {
      ws.sendObj({
        type: RespConstants.RESP_TYPE_PUSH,
        data: msgObj
      });
    }
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