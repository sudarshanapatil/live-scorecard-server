const express = require("express");
const router = express.Router();

//creates team and players keys
router.post("/apis/createteam", (req, reply) => {
  //set teamscore to 0
  let { teamId, teamName, teamPlayers, totalOvers, teamLogo } = req.body;
  let counter = 1;
  console.log( "API data : ",req.body)
  let funcArr = [];
  funcArr = teamPlayers.map((key) => global.db.redis.hmsetAsync(`team${teamId}::player${counter++}`, key))
  funcArr.push(global.db.redis.hmsetAsync(`team${teamId}::info`, { teamName, teamLogo }), global.db.redis.setAsync(`match::overs`, totalOvers))
  Promise.all(funcArr)
    .then((res) => {
      reply.send({ response: "created team successsfully", code: 200 }).status(200);
    })
    .catch((err) => {
      console.log(err)
      reply.send({ response: "Something went wrong", code: 402 }).status(402);
    })

});
//set toss result and which team is batting
router.post("/apis/toss", (req, reply) => {
  let { teamId, battingTeam, decision } = req.body;
  global.db.redis.hmsetAsync("team::toss", {
    teamId,
    battingTeam,
    decision
  }).then(function (res) {
    console.log({ response: res })
    reply.send({ response: res }).status(200);
  }).catch(function (err) {
    console.log("Error : ", err)
  })
})


//TODO
router.post("/apis/test", async (req, reply) => {
  let type = req.body.type;
  let key = req.body.key;
  console.log("key is : ", key)
  if (type == "keys")
    global.db.redis.keysAsync("*")
      .then(function (res) {
        console.log({ response: res })
        reply.send({ response: res }).status(200);
      }).catch(function (err) {
        console.log("Error : ", err)
      })
  else if (type == "team") {
    global.db.redis.hgetallAsync(key)
      .then(function (res) {
        console.log({ response: res })
        reply.send({ response: res }).status(200);
      }).catch(function (err) {
        console.log("Error : ", err)
      })
  }
  else if (type == "status") {
    global.db.redis.getAsync("match::status")
      .then(function (res) {
        console.log({ response: res })
        reply.send({ response: res }).status(200);
      }).catch(function (err) {
        console.log("Error : ", err)
      })
  }
  else {
    global.db.redis.hgetallAsync(key)
      .then(function (res) {
        console.log({ response: res })
        reply.send({ response: res }).status(200);
      }).catch(function (err) {
        console.log("Error : ", err)
      })
  }
  // global.db.redis.lrangeAsync(["current::over",0,-1])
  //   .then(function (res) {
  //     console.log({ response: JSON.parse(res) })
  //     reply.send({ response: JSON.parse(res) }).status(200);
  //   }).catch(function (err) {
  //     console.log("Error : ", err)
  //   })

})
module.exports = router;
