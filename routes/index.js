const express = require("express");
const router = express.Router();
const async = require("async")

//creates team and players keys
router.post("/apis/createteam", (req, reply) => {
  //set teamscore to 0
  let { teamId, teamName, teamPlayers, totalOvers ,teamLogo} = req.body;
  let counter = 1;
  console.log(req.body,"API data")
  async.each(teamPlayers, (i, cb) => {
    //set players data in redis
    let key = `team${teamId}::player${counter++}`;
    i.fours = i.sixes = 0;

    global.db.redis.hmsetAsync(key, i)
      .then((res) => {
        console.log(`${key} set successfully `)
        cb()
      })
      .catch((err) => {
        console.log("Error in redis : ", err)
        cb()
      })
  }, (done) => {
    //set teamName
    console.log(teamName,"========teamname")
    global.db.redis.hmsetAsync(`team${teamId}::info`, {teamName,teamLogo})
      .then((res) => {
        return global.db.redis.setAsync(`match::overs`, totalOvers)
      })
      .then((res) =>{
        console.log({ response: "created team successsfully" })
        reply.send({ response: "created team successsfully" }).status(200);
      })
      .catch((err) => {
       console.log("error is : ",err)
      })
  })
});

//get players of team 
router.get("/apis/getplayers/:teamId", (req, reply) => {
  let teamId = req.params.teamId;
  global.db.redis.keysAsync(`team${teamId}::*`, (err, res) => {
    if (err)
      console.log("Error : ", err)
    else {
      let resArr = []
      async.each(res, (i, cb) => {
        global.db.redis.hgetallAsync(i)
          .then((mres) => {
            resArr.push(mres)
            console.log({ response: mres })
            cb();
          })
          .catch((err) => {
            console.log(err)
            cb();
          })
      }, () => {
        reply.send({ response: resArr }).status(200);
      })
    }
  })

})
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
  console.log("key is : ",key)
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
