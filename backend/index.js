const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const ConnectDB = require("./config/dbConnect.js");
const bodyParser = require("body-parser");
const authRoute = require("./routes/auth-routes.js");
const chatRoute = require("./routes/chat-routes.js");
const statusRoute = require("./routes/status-routes.js");
const http = require("http");
const initializeSocket = require("./services/socketService.js");

dotenv.config();
// database connection
ConnectDB();

const app = express();

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL,  // your frontend domain
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json()); //parse body data
app.use(cookieParser()); //parse token on every request
app.use(bodyParser.urlencoded({ extended: true }));

// create server
const server = http.createServer(app);

const io = initializeSocket(server);

// apply socket middleware before routes
app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap;
  next();
});

// routers
app.use("/api/auth", authRoute);
app.use("/api/chats", chatRoute);
app.use("/api/status",statusRoute)

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`server running at port ${PORT}`);
});
