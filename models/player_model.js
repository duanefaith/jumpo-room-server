const EventEmitter = require('events').EventEmitter;
const Events = require('../constants/event_constants');

function Player(id) {
  this.id = id;
  this.room = null;
  this.name = null;
  this.photo = null;
  this.events = new EventEmitter();
}

Player.prototype.getEvents = function () {
  return this.events;
};

Player.prototype.getId = function () {
  return this.id;
};

Player.prototype.setName = function (name) {
  var oldName = this.name;
  this.name = name;
  this.events.emit(Events.EVENT_PROPERTY_CHANGED, this, 'name', oldName, name);
};

Player.prototype.getName = function (name) {
  return this.name;
};

Player.prototype.setRoom = function (room) {
  var oldRoom = this.room;
  this.room = room;
  this.events.emit(Events.EVENT_PROPERTY_CHANGED, this, 'room', oldRoom, room);
};

Player.prototype.getRoom = function () {
  return this.room;
};

Player.prototype.setPhoto = function (photo) {
  var oldPhoto = this.photo;
  this.photo = photo;
  this.events.emit(Events.EVENT_PROPERTY_CHANGED, this, 'photo', oldPhoto, photo);
};

Player.prototype.getPhoto = function () {
  return this.photo;
};

Player.prototype.destroy = function () {
  this.events.removeAllListeners(Events.EVENT_PROPERTY_CHANGED);
};

Player.createFromObj = function (obj) {
  if (obj && obj.hasOwnProperty('id')) {
    var player = new Player(obj.id);
    if (obj.hasOwnProperty('name')) {
      player.setName(obj.name);
    }
    if (obj.hasOwnProperty('photo')) {
      player.setPhoto(obj.photo);
    }
    return player;
  }
  return null;
};

Player.prototype.isWandering = function () {
  return this.room == null;
};

Player.prototype.isPending = function () {
  return this.room != null && this.room.isPending();
};

Player.prototype.isPlaying = function () {
  return this.room != null && this.room.isPlaying();
};

module.exports = Player;