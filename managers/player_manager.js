const Events = require('../constants/event_constants');
const SocketManager = require('./socket_manager');

function PlayerManager() {
  this.players = {};
}

PlayerManager.prototype.findPlayer = function (playerId) {
  return this.players[playerId];
};

PlayerManager.prototype.addOrGetPlayer = function (player) {
  if (player == null) {
    return;
  }
  var foundPlayer = this.findPlayer(player.getId())
  if (foundPlayer) {
    return foundPlayer;
  }
  this.players[player.getId()] = player;
  player.getEvents().on(Events.EVENT_PROPERTY_CHANGED, function (target, property, oldValue, currentValue) {
    if (property === 'room') {
      console.log('player '
        + target.getId() + ' '
        + (oldValue ? oldValue.getId() : null) + '=>'
        + (currentValue ? currentValue.getId() : null));
    }
  });
  var self = this;
  player.getEvents().on(Events.EVENT_DESTORY, function (target) {
    if (target) {
      SocketManager.getInstance().disAssociate(target);
      delete self.players[target.getId()];
    }
  });
  return player;
};

PlayerManager.prototype.removePlayer = function (player) {
  if (player == null) {
    return;
  }
  delete this.players[player.getId()];
};
  
module.exports = function () {
  var instance;
  return {
    getInstance: function () {
      if (!instance) {
        instance = new PlayerManager();
      }
      return instance;
    }
  };
} ();