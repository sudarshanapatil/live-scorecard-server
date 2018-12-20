const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const redis = require('redis');
const index = require("./routes/index");
const app = express();
const Bluebird = require('bluebird')

const bodyParser = require('body-parser');
const conf = require("./conf/dev.conf")
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded bodies
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


// Creating ingestion server
const ingestionServer = http.createServer(app);

// Socket connection for ingestion
const receiver = socketIo(ingestionServer);

receiver.on("connection", socket => {
  console.log('Connected to ingestion client');

  // TODO: Send current status of match
  const initialize = () => {
    redisClient.get('match:status', (err, res) => {
      if(err) {
        console.log('Error : ', err);
      } else {
        let value;
        if (res) {
          value = res.value;
        } else {
          value = 1;
        }
        socket.emit('initialize', value);
      }
    })
  }

  initialize();

  socket.on('matchStart',data => {})
  socket.on('nextScreen', status => {
    console.log('Status : ', status);
    redisClient.set('match:status', status);
  });

  socket.on("getTeamData", dataFromClient => {
    console.log("ingestion clinet", dataFromClient)

  })
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
  socket.emit('initialize', scoreCardDisplay)

  socket.on("disconnect", () => console.log("Client disconnected"));
});

broadcastServer.listen(broadcastPort, () => console.log(`Listening on port ${broadcastPort}`));

//creating server for APIS
const apiServer = http.createServer(app);

apiServer.listen(serverPort, () => console.log(`Listening on port ${serverPort}`));