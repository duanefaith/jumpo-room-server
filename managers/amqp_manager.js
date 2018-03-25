var amqp = require('amqplib');
var co = require('co');
var amqpConfig = require('../configs/amqp_config.json');
var ServerError = require('../utils/server_error');
var CommonError = require('../constants/error_constants').COMMON;

function AmqpManager() {
  this.connection = null;
}

AmqpManager.prototype.connect = function () {
  var self = this;
  co(function *() {
    self.connection = yield amqp.connect(amqpConfig.address);
  }).catch(function (error) {
    console.log(error);
  });
};

AmqpManager.prototype.send = function (queue, msg) {
  if (!this.connection) {
    throw new ServerError(CommonError.INTERNAL_ERROR, 'amqp not established');
  }
  var self = this;
  co(function *() {
    var channel = yield self.connection.createChannel();
    yield channel.assertQueue(queue, {durable: false});
    channel.sendToQueue(queue, new Buffer(msg));
    yield channel.close();
  }).catch(function (error) {
    console.log(error);
  });
};

module.exports = function () {
  var instance;
  return {
    getInstance: function () {
      if (!instance) {
        instance = new AmqpManager();
      }
      return instance;
    }
  };
}();