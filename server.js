const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const redis = require('redis');
const cors = require('cors')
const index = require("./routes/index");
const Bluebird = require('bluebird')
const bodyParser = require('body-parser');
const conf = require("./conf/dev.conf")
const app = express();
app.use(cors());
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded bodies
const eventsIS = require("./events/inningStart.js")
const eventsOS = require("./events/overStart.js")
const eventsW = require("./events/wicket.js")
const eventsIE = require("./events/inningEnd.js")
const eventsE = require("./events/extra.js")
const eventsEBU = require("./events/eachBallUpdate.js")
const eventsI = require("./events/initialize.js")
const eventsNS = require("./events/nextScreen")

//routes to define APIs
app.use('/', index);
global.db = {};
const ingestionPort = process.env.IPORT || 4001;
const broadcastPort = process.env.BPORT || 4002;
const serverPort = process.env.PORT || 4000;

const scoreCardDisplay = {};

// Redis client
const redisClient = redis.createClient({
  host: conf.host,
  port: conf.port,
  no_ready_check: true,
  auth_pass: conf.auth_pass
});
Bluebird.promisifyAll(redis.RedisClient.prototype);
global.db.redis = redisClient

// Connection to redis
redisClient.on('connect', err => {
  console.log('Connected to redis');
});

redisClient.on('error', function (err) {
  console.log('Error connecting to redis : ' + err);
});

const calculateOver = () => {
  redisClient.getAsync('current::totalBalls')
    .then((res) => {
      let over = `${parseInt(res / 6)}.${res % 6}`;
      console.log(over, "over")
    })
    .catch((err) => { console.log("err: ", err) })
}
// Creating ingestion server
const ingestionServer = http.createServer(app);

// Socket connection for ingestion
const receiver = socketIo(ingestionServer);

receiver.on("connection", socket => {
  console.log('Connected to ingestion client');
  // TODO: Send current status of match
  eventsI(socket, redisClient);
  //after toss when inning starts
  eventsIS(socket, redisClient);
  //At start of each over
  eventsOS(socket, redisClient);
  //extra
  eventsE(socket, redisClient);
  //wicket
  eventsW(socket, redisClient);
  //inning end
  eventsIE(socket, redisClient);
  //eachballUpdate
  eventsEBU(socket, redisClient);
  //nextScreenINfo
  eventsNS(socket, redisClient)

  socket.on("disconnect", () => console.log("Client disconnected"));
});

ingestionServer.listen(ingestionPort, () => console.log(`Listening on port ${ingestionPort}`));

// Creating broadcast server
const broadcastServer = http.createServer(app);
// Socket connection for broadcast
const broadcast = socketIo(broadcastServer);
broadcast.on("connection", socket => {
  console.log('Connected to broadcast client');
  // TODO: Send current scorecard of match
  socket.on("initialize", scoreCardDisplay)
  socket.on("disconnect", () => console.log("Client disconnected"));
});

broadcastServer.listen(broadcastPort, () => console.log(`Listening on port ${broadcastPort}`));

//creating server for APIS
const apiServer = http.createServer(app);
apiServer.listen(serverPort, () => console.log(`Listening on port ${serverPort}`));