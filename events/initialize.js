let async = require("async")
const initialize = (socket, redisClient) => {
  //Initial event
  console.log(`Initializing..`)
  let scoreCardDisplay = {
    team1: {},
    team2: {}
  }
  let heading;
  redisClient.getAsync("current::inning")
    .then((resInning) => {
      scoreCardDisplay.inningId = parseInt(resInning);
      redisClient.hgetallAsync("team::toss")
        .then((resToss) => {
          let { battingTeam, teamId, decision } = resToss;
          scoreCardDisplay.toss = { teamId: teamId, decision: decision,battingTeam:battingTeam }
          let funArr = [redisClient.getAsync(`team1::name`),
          redisClient.getAsync(`team2::name`),
          redisClient.getAsync(`current::striker`),
          redisClient.getAsync(`current::nonStriker`),
          redisClient.getAsync(`current::bowler`),
          redisClient.getAsync(`team1::score`),
          redisClient.getAsync(`team1::wicket`),
          redisClient.getAsync(`team2::score`),
          redisClient.getAsync(`team2::wicket`),
          ]
          Promise.all(funArr)
            .then((res) => {
              scoreCardDisplay.team1 = {
                name: res[0].name,
                logo: res[0].logo,
                runs: res[5],
                wickets: res[6]
              }
              scoreCardDisplay.team2 = {
                name: res[1].name,
                logo: res[1].logo,
                runs: res[7],
                wickets: res[8]
              }
              if (teamId == 1) {
                scoreCardDisplay.team1.wonToss = true
                scoreCardDisplay.team2.wonToss = false
                if (battingTeam == 1) {
                  scoreCardDisplay.team1.isBatting = true
                  scoreCardDisplay.team2.isBatting = false
                }
                else {
                  scoreCardDisplay.team1.isBatting = false
                  scoreCardDisplay.team2.isBatting = true
                }
              }
              else {
                scoreCardDisplay.team2.wonToss = true
                scoreCardDisplay.team1.wonToss = false
                if (battingTeam == 1) {
                  scoreCardDisplay.team1.isBatting = true
                  scoreCardDisplay.team2.isBatting = false
                }
                else {
                  scoreCardDisplay.team1.isBatting = false
                  scoreCardDisplay.team2.isBatting = true
                }
              }

              let strikerId = res[2];
              let nonStrikerId = res[3];
              let bowlerId = res[4];
              let playerFunc = [redisClient.hgetallAsync(`team${battingTeam}::player${strikerId}`),
              redisClient.hgetallAsync(`team${battingTeam}::player${nonStrikerId}`),
              redisClient.hgetallAsync(`team${battingTeam}::player${bowlerId}`),
              redisClient.lrangeAsync("current::over1", 0, -1),
              redisClient.smembersAsync(`team${teamId}::playedBatsman`)
              ]

              Promise.all(playerFunc)
                .then((resPlayer) => {

                  if (resPlayer[0]) {
                    scoreCardDisplay.striker = {
                      name: resPlayer[0].name,
                      runs: parseInt(resPlayer[0].runScored),
                      balls: parseInt(resPlayer[0].ballsFaced),
                      fours: parseInt(resPlayer[0].fours),
                      sixes: parseInt(resPlayer[0].sixes)
                    }
                  }
                  if (resPlayer[1]) {
                    scoreCardDisplay.nonStriker = {
                      name: resPlayer[1].name,
                      runs: parseInt(resPlayer[1].runScored),
                      balls: parseInt(resPlayer[1].ballsFaced),
                      fours: parseInt(resPlayer[1].fours),
                      sixes: parseInt(resPlayer[1].sixes)
                    }
                  }
                  if (resPlayer[2]) {
                    scoreCardDisplay.bowler = {
                      name: resPlayer[2].name,
                      runsGiven: parseInt(resPlayer[2].runsGiven),
                      ballsBowled: parseInt(resPlayer[2].overs),
                      maiden: parseInt(resPlayer[2].maiden),
                      wickets: parseInt(resPlayer[2].wickets),
                    }
                  }
                  scoreCardDisplay.overArray = resPlayer[3]
                  let batsmanBoard = {}
                  let playerArr = []
                  async.each(resPlayer[4], (i, cb) => {  //TODO:remove async and use Promiss.all
                    redisClient.hgetallAsync(`team${battingTeam}::player${i}`)
                      .then(function (res) {
                        playerArr.push({
                          name: res.name,
                          runs:parseInt(res.runScored),
                          balls: parseInt(res.ballsFaced),
                          fours: parseInt(res.fours),
                          sixes: parseInt(res.sixes)
                        })
                        cb()

                      })
                      .catch(err => {
                        console.log(err)
                        cb()
                      })

                  }, () => {
                    redisClient.getAsync('match::status')
                      .then((res) => {
                        let value;
                        if (res) {
                          value = res.value;
                        } else {
                          value = 1;
                        }
                        scoreCardDisplay.batsmanBoard = playerArr;
                        scoreCardDisplay.matchStatus = value;
                        //  console.log("scorecard...", scoreCardDisplay)
                        //if (key == "admin") {//to Admin
                        socket.emit('initialize', scoreCardDisplay);
                        //}
                        // else if (key == "user") {//to User
                        socket.emit("initialize", scoreCardDisplay);
                        //}

                      })
                      .catch((err) => console.log('Error : ', err))

                  })

                })
                .catch((err) => { console.log(err) })
            })
            .catch((err) => { console.log(err) })
        })
        .catch((err) => { console.log(err) })
    })


}

module.exports = initialize;