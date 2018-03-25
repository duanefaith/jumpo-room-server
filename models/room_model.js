const EventEmitter = require('events').EventEmitter;
const Events = require('../constants/event_constants');

function Room(id, creator) {
  this.id = id;
  this.creator = creator;
  this.creator.setRoom(this);
  this.players = {};
  this.players[creator.getId()] = creator;
  this.state = Room.STATE_WAITING;
  this.events = new EventEmitter();
}

Room.STATE_WAITING = 0;
Room.STATE_PENDING = 1;
Room.STATE_PLAYING = 2;

Room.prototype.getEvents = function () {
  return this.events;
};

Room.prototype.getId = function () {
  return this.id;
};

Room.prototype.hasPlayerId = function (playerId) {
  return this.players.hasOwnProperty(playerId);
};

Room.prototype.hasPlayer = function (player) {
  if (player) {
    return this.hasPlayerId(player.getId());
  }
  return false;
};

Room.prototype.addPlayer = function (player) {
  if (this.hasPlayer(player)) {
    return false;
  }
  var oldPlayers = {};
  Object.assign(oldPlayers, this.players);
  player.setRoom(this);
  this.players[player.getId()] = player;
  this.events.emit(Events.EVENT_PROPERTY_CHANGED, this, 'players', oldPlayers, this.players);
  return true;
};

Room.prototype.removePlayerId = function (playerId) {
  if (!this.hasPlayerId(playerId)) {
    return false;
  }
  var oldPlayers = {};
  Object.assign(oldPlayers, this.players);
  var player = this.players[playerId];
  player.setRoom(null);
  delete this.players[playerId];
  this.events.emit(Events.EVENT_PROPERTY_CHANGED, this, 'players', oldPlayers, this.players);
  player.destroy();

  return true;
};

Room.prototype.getPlayers = function () {
  var array = [];
  var self = this;
  Object.keys(this.players).forEach(function (key) {
    array.push(self.players[key]);
  });
  return array;
};

Room.prototype.setState = function (state) {
  var oldState = this.state;
  this.state = state;
  this.events.emit(Events.EVENT_PROPERTY_CHANGED, this, 'state', oldState, state);
};

Room.prototype.getState = function () {
  return this.state;
};

Room.prototype.destroy = function () {
  this.events.emit(Events.EVENT_DESTORY, this);
  this.events.removeAllListeners(Events.EVENT_DESTORY);
  this.events.removeAllListeners(Events.EVENT_PROPERTY_CHANGED);
  var self = this;
  Object.keys(this.players).forEach(function (key) {
    self.players[key].destroy();
  });
};

Room.prototype.toObj = function () {
  var obj = {};
  if (this.id) {
    obj.id = this.id;
  }
  if (this.creator) {
    obj.creator = this.creator.toObj();
  }
  if (this.players) {
    obj.players = {};
    var self = this;
    Object.keys(this.players).forEach(function (key) {
      obj.players[key] = self.players[key].toObj();
    });
  }
  if (this.state) {
    obj.state = this.state;
  }
  return obj;
};

module.exports = Room;