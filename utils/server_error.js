function ServerError(code, msg = null) {
  ServerError.prototype.code = code;
  ServerError.prototype.msg = msg;
}

ServerError.prototype = Object.create(Error.prototype);
ServerError.prototype.constructor = ServerError;

module.exports = ServerError;