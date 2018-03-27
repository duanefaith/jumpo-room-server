module.exports = {
  COMMON: {
    INTERNAL_ERROR: 10,
  },
  ROOM : {
    ROOM_NOT_FOUND: 100,
    PLAYER_INFO_INVALID: 101,
    ROOM_STATE_INVALID: 102,
    ROOM_IS_PENDING: 103,
    CREATE: {

    },
    JOIN: {
      PLAYER_ALREADY_IN: 140,
      TOO_MANY_PLAYERS: 141,
    },
    QUIT: {
      PLAYER_NOT_IN: 160,
    },
    START_GAME: {
      NO_AUTH: 180,
      TOO_FEW_PLAYERS: 181,
    },
  }
};