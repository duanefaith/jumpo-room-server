const EventEmitter = require('events').EventEmitter;
const Events = require('../constants/event_constants');

function Room(id, creator) {
  this.id = id;
  this.creator = creator;
  this.creator.setRoom(this);
  this.players = {};
  this.players[creator.getId()] = creator;
  this.state = Room.STATE_PENDING;
  this.events = new EventEmitter();
}

Room.STATE_PENDING = 0;
Room.STATE_PLAYING = 1;

Room.prototype.getEvents = function () {
  return this.events;
};

Room.prototype.getId = function () {
  return this.id;
};

Room.prototype.hasPlayer = function (player) {
  return this.players.hasOwnProperty(player.getId());
};

Room.prototype.addPlayer = function (player) {
  if (this.hasPlayer(playerId)) {
    return false;
  }
  this.players[player.getId()] = player;
  return true;
};

Room.prototype.getPlayers = function () {
  var array = [];
  Object.keys(this.players).forEach(function (key) {
    array.push(this.players[key]);
  });
  return array;
};

Room.prototype.setState = function (state) {
  var oldState = this.state;
  this.state = state;
  this.events.emit(Events.EVENT_PROPERTY_CHANGED, this, 'state', oldState, state);
};

Room.prototype.isPending = function () {
  return this.state == Room.STATE_PENDING;
};

Room.prototype.isPlaying = function () {
  return this.state == Room.STATE_PLAYING;
};

module.exports = Room;