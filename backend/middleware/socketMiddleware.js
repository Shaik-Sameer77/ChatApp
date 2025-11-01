const jwt = require("jsonwebtoken");

const socketMiddleware = (socket, next) => {

  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return next(new Error("Authentication token missing"))
  }

  try {
    const decode = jwt.verify(
      token,
      // authToken,
      process.env.JWT_SECRET
    );
    socket.user = decode;
    next();
  } catch (error) {
    console.error(error);
    return next(new Error("Invalid or expired token"));
  }
};

module.exports = socketMiddleware;
