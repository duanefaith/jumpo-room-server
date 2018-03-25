const Room = require('../models/room_model');
const Player = require('../models/player_model');
const PlayerManager = require('../managers/player_manager');
const uidCreator = require('../utils/uid_creator');
const RoomErrors = require('../constants/error_constants').ROOM;
const ServerError = require('../utils/server_error');

function RoomManager() {
  this.pendingRooms = {};
}

RoomManager.prototype.createRoom = function (creatorObj) {
  var creator = Player.createFromObj(creatorObj);
  if (!creator) {
    throw new ServerError(RoomErrors.CREATE.PLAYER_INFO_INVALID, 'invalid creator info');
  }
  creator = PlayerManager.getInstance().addOrGetPlayer(creator);
  var roomId = null;
  do {
    roomId = uidCreator.getUUIDV1();
  } while (this.pendingRooms.hasOwnProperty(roomId));
  var room = new Room(roomId, creator);
  this.pendingRooms[roomId] = room;
  return room;
};

RoomManager.prototype.joinRoom = function (roomId, playerObj) {
  var player = Player.createFromObj(playerObj);
  if (!player) {
    throw new ServerError(RoomErrors.PLAYER_INFO_INVALID, 'invalid player info');
  }
  player = PlayerManager.getInstance().addOrGetPlayer(player);
  if (this.pendingRooms.hasOwnProperty(roomId)) {
    var room = this.pendingRooms[roomId];
    if (!room.addPlayer(player)) {
      throw new ServerError(RoomErrors.CREATE.PLAYER_ALREADY_IN, 'player already in room');
    }
    return room;
  }
  throw new ServerError(RoomErrors.CREATE.ROOM_NOT_FOUND, 'room not exists');
};

RoomManager.prototype.findRoom = function (roomId) {
  return this.pendingRooms[roomId];
};

module.exports = function () {
  var instance;
  return {
    getInstance: function () {
      if (!instance) {
        instance = new RoomManager();
      }
      return instance;
    }
  };
} ();