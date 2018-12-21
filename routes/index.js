const express = require("express");
const router = express.Router();
const async = require("async")

//creates team and players keys
router.post("/apis/createteam", (req, reply) => {
  let { teamId, teamName, teamPlayers } = req.body;
  let counter = 1;
  async.each(teamPlayers, (i, cb) => {
    //set players data in redis
    let key = `team${teamId}::Player${counter++}`
    console.log("key: ", key)
    global.db.redis.hmsetAsync(key, i, (err, res) => {
      if (err) {
        console.log("Error in redis : ", err)
        cb()
      }
      else {
        console.log(`team${teamId}::player${counter++} set successfully `)
        cb()
      }
    })
  }, (done) => {
    //set teamName
    global.db.redis.setAsync(`${teamId}::name`, teamName, (err, res) => {
      if (err)
        console.log("Error : ", err)
      else {
        console.log({ response: "created team successsfully" })
        reply.send({ response: "created team successsfully" }).status(200);
      }
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
        global.db.redis.hgetall(i, (err, mres) => {
          resArr.push(mres)
          console.log({ response: mres })
          cb()
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
router.get("/apis/test", async (req, reply) => {
  let teamId = req.params.teamId;
  await global.db.redis.hgetallAsync("team6::player7")
    .then(function (res) {
      console.log({ response: res })
      reply.send({ response: res }).status(200);
    }).catch(function (err) {
      console.log("Error : ", err)
    })

})

module.exports = router;
