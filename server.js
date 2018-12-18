const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const port = process.env.PORT || 4001;
const index = require("./routes/index");
var redis = require('redis');
var client = redis.createClient({
    host:"redis-15812.c61.us-east-1-3.ec2.cloud.redislabs.com",
    port:15812,
    no_ready_check: true,
    auth_pass: 123 
});
client.on('connect', function() {
    console.log('Redis client connected');
});

client.on('error', function (err) {
    console.log('Something went wrong cannot connect to redis server : ' + err);
});
const app = express();
app.use(index);
const server = http.createServer(app);

let count=10;
const io = socketIo(server);
//creates socket connection
io.on("connection", socket => {
  console.log("New client connected"), setInterval(
    () => getApiAndEmit(socket),
    10000
  );
  socket.on("disconnect", () => console.log("Client disconnected"));
});
const getApiAndEmit = async socket => {
  try {
    count++;
    socket.emit("FromAPI",count);
    socket.emit("suddu" , 10);
  } catch (error) {
    console.error(`Error in api: ${error.code}`);
  }
};
server.listen(port, () => console.log(`Listening on port ${port}`));