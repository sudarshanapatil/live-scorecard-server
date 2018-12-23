const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const redis = require('redis');
const cors = require('cors')
const index = require("./routes/index");
const app = express();
const Bluebird = require('bluebird')
const bodyParser = require('body-parser');
const conf = require("./conf/dev.conf")
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded bodies

app.use(cors());

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
      if (err) {
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
  //after toss when match starts
  socket.on('matchStart', data => {
    console.log("match started", data)
    let { strikerId, nonStrikerId } = data;
    let funcArr=[redisClient.setAsync('current::striker', strikerId),redisClient.setAsync('current::nonStriker', nonStrikerId),redisClient.setAsync('current::totalballs', 0)]
    Promise.all(funcArr)
    .then((res)=>{
      console.log(res)
    })
    .catch((err) => {
      console.log(err)
    })
    // redisClient.setAsync('current::striker', strikerId)
    //   .catch((err) => { console.log(err) })
    // redisClient.setAsync('current::nonStriker', nonStrikerId)
    //   .catch((err) => { console.log(err) })
    // redisClient.setAsync('current::totalballs', 0)
    //   .catch((err) => { console.log(err) })
  })

  //At start of each over
  socket.on("overStart", data => {
    console.log("ovr start")
    //TODO maiden over check
    let { bowlerId } = data;
    redisClient.setAsync('current::bowler', bowlerId)
    //TODO:To check update on key
    redisClient.setAsync('current::over', JSON.stringify([0, 0, 0, 0, 0, 0]))
      .then((res) => { console.log("res: ", res) })
      .catch((err) => { console.log("err: ", err) })
  })

  socket.on("wicket", data => {
    let { wicketBy, wicketType, playerId, teamId } = data;
    redisClient.incrbyAsync(`current::wicket`, 1)
    if (wicketType == "catch")
      redisClient.hmsetAsync(`team${teamId}::player${playerId}`, { wicketBy, wicketType })
        .catch((err) => { console.log("err: ", err) })
  })

  socket.on("extra", data => {
    let { score, teamId } = data;
    redisClient.incrbyAsync(`team${teamId}::extra`, score)
      .catch((err) => { console.log("err: ", err) })
  })

  socket.on("four", data => {
    let { runScored, teamId, playerId } = data;
    console.log("in four : ", `team${teamId}::player${playerId}`)
    redisClient.hgetallAsync(`team${teamId}::player${playerId}`)
      .then(function (res) {
        console.log("res: ", res)
        res.fours++;
        redisClient.hmsetAsync(`team${teamId}::player${playerId}`, res)
          .catch((err) => { console.log("err: ", err) })
      })
      .catch((err) => { console.log("err: ", err) })
  })
  socket.on("six", data => {
    let { runScored, teamId, playerId } = data;
    console.log("in six : ", `team${teamId}::player${playerId}`)
    redisClient.hgetallAsync(`team${teamId}::player${playerId}`)
      .then(function (res) {
        console.log("res: ", res)
        res.sixes++;
        redisClient.hmsetAsync(`team${teamId}::player${playerId}`, res)
          .catch((err) => { console.log("err: ", err) })
      })
      .catch((err) => { console.log("err: ", err) })
  })
  socket.on("eachBallUpdate", data => {
    let { runScored, teamId, playerId } = data;
    console.log(data, "eachballupdate")

    let ballFaced = 2;
    let fours = sixes = 0;
    if (parseInt(runScored) == 4)
      fours = 1
    else if (parseInt(runScored) == 6)
      sixes = 1
    redisClient.incrbyAsync(`current::totalBalls`, 1)
      .catch((err) => { console.log("err: ", err) })
    redisClient.incrbyAsync(`current::score`, runScored)
      .catch((err) => { console.log("err: ", err) })
    //TODO
    // redisClient.hmsetAsync(`team${teamId}::player${playerId}`, { runScored, fours, sixes });
  })

  socket.on('nextScreen', status => {
    console.log('Status : ', status);
    redisClient.setAsync('match:status', status);
  });

  socket.on('endMatch', data => {
    let { teamId, totalScore, totalWicket } = data;
    console.log('Status : ', status);
    redisClient.setAsync(`team${teamId}::score`, totalScore)
      .catch((err) => { console.log("err: ", err) })
    redisClient.setAsync(`team${teamId}::wicket`, totalWicket)
      .catch((err) => { console.log("err: ", err) })
  });

  socket.on('currentOver', status => {
    redisClient.getAsync('current::totalBalls')
      .then((res) => {
        let over = `${parseInt(res / 6)}.${res % 6}`;
        console.log(over, "over")
      })
      .catch((err) => { console.log("err: ", err) })
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
  socket.on("initialize", scoreCardDisplay)
  socket.on("disconnect", () => console.log("Client disconnected"));
});

broadcastServer.listen(broadcastPort, () => console.log(`Listening on port ${broadcastPort}`));

//creating server for APIS
const apiServer = http.createServer(app);

apiServer.listen(serverPort, () => console.log(`Listening on port ${serverPort}`));