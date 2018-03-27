const Room = require('../models/room_model');
const Player = require('../models/player_model');
const PlayerManager = require('./player_manager');
const uidCreator = require('../utils/uid_creator');
const RoomErrors = require('../constants/error_constants').ROOM;
const ServerError = require('../utils/server_error');
const Events = require('../constants/event_constants');
const SocketManager = require('./socket_manager');

function RoomManager() {
  this.waitingRooms = {};
  this.pendingRooms = {};
}

RoomManager.prototype.createRoom = function (creatorObj) {
  var creator = Player.createFromObj(creatorObj);
  if (!creator) {
    throw new ServerError(RoomErrors.PLAYER_INFO_INVALID, 'invalid creator info');
  }
  creator = PlayerManager.getInstance().addOrGetPlayer(creator);
  var roomId = null;
  do {
    roomId = uidCreator.getUUIDV1();
  } while (this.waitingRooms.hasOwnProperty(roomId));
  var room = new Room(roomId, creator);
  this.waitingRooms[roomId] = room;
  room.getEvents().on(Events.EVENT_PROPERTY_CHANGED, function (target, property, oldValue, currentValue) {
    if (property == 'players') {
      if (target.getState() == Room.STATE_WAITING) {
        if (oldValue) {
          var oldPlayerIds = Object.keys(oldValue);
          if (oldPlayerIds.length > 0) {
            SocketManager.getInstance().broadcastToPlayerIds(oldPlayerIds, {
              event: 'players_property_changed',
              room: target.toObj()
            });
          }
        }
      }
    } else if (property == 'creator') {
      if (!currentValue) {
        room.destroy();
      }
    } else if (property == 'state') {
      if (currentValue === Room.STATE_PENDING) {
        SocketManager.getInstance().broadcastToPlayers(target.getPlayers(), {
          event: 'room_state_changed',
          room: target.toObj()
        });
      }
    }
  });
  var self = this;
  room.getEvents().on(Events.EVENT_DESTORY, function (target) {
    if (target) {
      delete self.waitingRooms[target.getId()];
    }
  });
  return {
    room: room,
    creator: creator
  };
};

RoomManager.prototype.joinRoom = function (roomId, playerObj) {
  var player = Player.createFromObj(playerObj);
  if (!player) {
    throw new ServerError(RoomErrors.PLAYER_INFO_INVALID, 'invalid player info');
  }
  player = PlayerManager.getInstance().addOrGetPlayer(player);
  if (this.waitingRooms.hasOwnProperty(roomId)) {
    var room = this.waitingRooms[roomId];
    if (room.state !== Room.STATE_WAITING) {
      throw new ServerError(RoomErrors.ROOM_STATE_INVALID, 'room state invalid');
    }
    if (room.getPlayers().length >= 2) {
      throw new ServerError(RoomErrors.JOIN.TOO_MANY_PLAYERS, "players too many");
    }
    if (!room.addPlayer(player)) {
      throw new ServerError(RoomErrors.JOIN.PLAYER_ALREADY_IN, 'player already in room');
    }
    return {
      room: room,
      player: player
    };
  }
  if (this.pendingRooms.hasOwnProperty(roomId)) {
    throw new ServerError(RoomErrors.ROOM_IS_PENDING, 'room has started a game');
  }
  throw new ServerError(RoomErrors.ROOM_NOT_FOUND, 'room not exists');
};

RoomManager.prototype.findRoom = function (roomId) {
  return this.waitingRooms[roomId];
};


RoomManager.prototype.quitRoom = function (roomId, playerId) {
  if (this.waitingRooms.hasOwnProperty(roomId)) {
    var room = this.waitingRooms[roomId];
    if (room.state !== Room.STATE_WAITING) {
      throw new ServerError(RoomErrors.ROOM_STATE_INVALID, 'room state invalid');
    }
    if (!room.removePlayerId(playerId)) {
      throw new ServerError(RoomErrors.QUIT.PLAYER_NOT_IN, 'player not in room');
    }
    if (playerId == room.getCreator().getId()) {
      var players = room.getPlayers();
      if (players.length > 0) {
        room.setCreator(players[0]);
      } else {
        room.setCreator(null);
      }
    }
    return;
  }
  throw new ServerError(RoomErrors.ROOM_NOT_FOUND, 'room not exists');
};

RoomManager.prototype.startGame = function (roomId, playerId) {
  if (this.waitingRooms.hasOwnProperty(roomId)) {
    var room = this.waitingRooms[roomId];
    if (room.getState() !== Room.STATE_WAITING) {
      throw new ServerError(RoomErrors.ROOM_STATE_INVALID, 'room state invalid');
    }
    if (room.getCreator().getId() != playerId) {
      throw new ServerError(RoomErrors.START_GAME.NO_AUTH, 'no auth to start game');
    }
    if (room.getPlayers().length <= 1) {
      throw new ServerError(RoomErrors.START_GAME.TOO_FEW_PLAYERS, 'players too few');
    }
    delete this.waitingRooms[roomId];
    this.pendingRooms[roomId] = room;
    room.setState(Room.STATE_PENDING);
    return;
  }
  if (this.pendingRooms.hasOwnProperty(roomId)) {
    throw new ServerError(RoomErrors.ROOM_IS_PENDING, 'room has started a game');
  }
  throw new ServerError(RoomErrors.ROOM_NOT_FOUND, 'room not exists');
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