const Events = require('../constants/event_constants');

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
  return player;
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