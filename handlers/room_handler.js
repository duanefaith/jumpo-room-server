var RoomManager = require('../managers/room_manager');

module.exports = {
  'room.create': function (ws, data) {
    try {
      const room = RoomManager.getInstance().createRoom(data.creator);
      ws.sendObj({
        end_point: 'ws://xxxx',
        room_id: room.getId()
      });
    } catch (error) {
      console.log(error);
      ws.sendObj({
        error: {
          code: error.code,
          msg: error.msg
        }
      });
    }
  }
};