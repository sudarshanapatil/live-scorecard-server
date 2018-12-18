const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const redis = require('redis');

const ingestionPort = process.env.IPORT || 4001;
const broadcastPort = process.env.BPORT || 4002;

const index = require("./routes/index");

// Redis client
const client = redis.createClient({
  host: "redis-15812.c61.us-east-1-3.ec2.cloud.redislabs.com",
  port: 15812,
  no_ready_check: true,
  auth_pass: 123
});

// Connection to redis
client.on('connect', err => {
  console.log('Connected to redis');
});

client.on('error', function (err) {
  console.log('Error connecting to redis : ' + err);
});

const app = express();
const ingestionServer = http.createServer(app);

// Socket connection for ingestion
const receiver = socketIo(ingestionServer);

receiver.on("connection", socket => {
  console.log('Connected to client');

  // TODO: Send current status of match
  socket.emit('initialize', 'teamPlayers')

  socket.on("disconnect", () => console.log("Client disconnected"));
});

ingestionServer.listen(ingestionPort, () => console.log(`Listening on port ${ingestionPort}`));