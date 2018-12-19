const express = require("express");
const router = express.Router();
const shortid = require('shortid');
const async = require("async")

//creates team and players keys
router.post("/apis/createteam", (req, reply) => {
  let { teamId,teamName, teamPlayers } = req.body;
  
  let counter = 1;
  async.each(teamPlayers, (i, cb) => {
    //set players data in redis
    global.db.redis.set(`team::${teamId}::Player${counter++}`, "jjhj", (err, res) => {
      if (err) {
        console.log("Error in redis : ", err)
        cb()
      }
      else {
        console.log(`${teamId}::Player${counter++}`)
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
// router.get("/apis/getPlayers", (req, reply) => {
//   let teamId=req.params.teamId;
//   global.db.redis.get(`${teamId}::name`, teamName, (err, res) => {
//     if (err)
//       console.log("Error : ", err)
//     else {
//       console.log({ response: "created team successsfully" })
//       reply.send({ response: "created team successsfully" }).status(200);
//     }
//   })
  
// })

module.exports = router;
