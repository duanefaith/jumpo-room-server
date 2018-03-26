var RoomManager = require('../managers/room_manager');
var ServerError = require('../utils/server_error');
var CommonError = require('../constants/error_constants').COMMON;
const SocketManager = require('../managers/socket_manager');

module.exports = {
  'room.create': function (ws, data, req) {
    if (!data.hasOwnProperty('creator')) {
      throw new ServerError(CommonError.INTERNAL_ERROR, 'missing creator parameter');
    }
    const {room, creator} = RoomManager.getInstance().createRoom(data.creator);
    SocketManager.getInstance().associate(creator, ws);
    ws.sendResp(req, {room: room.toObj()});
  },
  'room.join': function (ws, data, req) {
    if (!data.hasOwnProperty('roomId')) {
      throw new ServerError(CommonError.INTERNAL_ERROR, 'missing roomId parameter');
    }
    if (!data.hasOwnProperty('player')) {
      throw new ServerError(CommonError.INTERNAL_ERROR, 'missing player parameter');
    }
    const {room, player} = RoomManager.getInstance().joinRoom(data.roomId, data.player);
    SocketManager.getInstance().associate(player, ws);
    ws.sendResp(req, {room: room.toObj()});
  },
  'room.quit': function (ws, data, req) {
    if (!data.hasOwnProperty('roomId')) {
      throw new ServerError(CommonError.INTERNAL_ERROR, 'missing roomId parameter');
    }
    if (!data.hasOwnProperty('playerId')) {
      throw new ServerError(CommonError.INTERNAL_ERROR, 'missing playerId parameter');
    }
    RoomManager.getInstance().quitRoom(data.roomId, data.playerId);
    ws.sendResp(req, {success: true});
  },
};