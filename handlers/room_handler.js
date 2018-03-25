var RoomManager = require('../managers/room_manager');
var ServerError = require('../utils/server_error');
var CommonError = require('../constants/error_constants').COMMON;

module.exports = {
  'room.create': function (ws, data) {
    if (!data.hasOwnProperty('creator')) {
      throw new ServerError(CommonError.INTERNAL_ERROR, 'missing creator parameter');
    }
    const room = RoomManager.getInstance().createRoom(data.creator);
    ws.sendObj({
      room: room.toObj()
    });
  },
  'room.join': function (ws, data) {
    if (!data.hasOwnProperty('roomId')) {
      throw new ServerError(CommonError.INTERNAL_ERROR, 'missing roomId parameter');
    }
    if (!data.hasOwnProperty('player')) {
      throw new ServerError(CommonError.INTERNAL_ERROR, 'missing player parameter');
    }
    const room = RoomManager.getInstance().joinRoom(data.roomId, data.player);
    ws.sendObj({
      room: room.toObj()
    });
  },
};