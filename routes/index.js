const express = require("express");
const router = express.Router();
const shortid = require('shortid');
const async = require("async")

//creates team and players keys
router.post("/apis/createteam", (req, reply) => {
  let { teamId, teamName, teamPlayers } = req.body;
  let counter = 1;
  async.each(teamPlayers, (i, cb) => {
    //set players data in redis
    let key = `team${teamId}::Player${counter++}`
    console.log("key: ", key)
    global.db.redis.hmset(key, i, (err, res) => {
      if (err) {
        console.log("Error in redis : ", err)
        cb()
      }
      else {
        console.log(`team${teamId}::Player${counter++} set successfully `)
        cb()
      }
    })
  }, (done) => {
    //set teamName
    global.db.redis.set(`${teamId}::name`, teamName, (err, res) => {
      if (err)
        console.log("Error : ", err)
      else {
        console.log({ response: "created team successsfully" })
        reply.send({ response: "created team successsfully" }).status(200);
      }
    })
  })
});

//TODO
router.get("/apis/getplayers/:teamId", (req, reply) => {
  let teamId = req.params.teamId;
  global.db.redis.keys(`team${teamId}::*`, (err, res) => {
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

//TODO
router.get("/apis/test", (req, reply) => {
  let teamId = req.params.teamId;
  global.db.redis.hgetall("team1::Player1", (err, res) => {
    if (err)
      console.log("Error : ", err)
    else {
      console.log({ response: res })
      reply.send({ response: res }).status(200);
    }
  })

})

module.exports = router;
