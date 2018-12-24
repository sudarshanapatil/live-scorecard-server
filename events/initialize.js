let async = require("async")
const initialize = (socket, redisClient) => {
  //Initial event
  console.log("initializing")
  redisClient.getAsync('match:status')
    .then((res) => {
      let value;
      if (res) {
        value = res.value;
      } else {
        value = 1;
      }
      socket.emit('initialize', value);
    })
    .catch((err) => console.log('Error : ', err))

  //data to be sent to userBoard
  let scoreCardDisplay = {
    team1: {},
    team2: {}
  }
  let heading;
  redisClient.getAsync("current::inning")
    .then((resInning) => {
      scoreCardDisplay.inningId = resInning;
      redisClient.hgetallAsync("team::toss")
        .then((resToss) => {
          let { battingTeam, teamId, decision } = resToss;
          console.log(teamId, "teamID")
          //if its a First inning get info who own d toss
          if (resInning == 1) {
            scoreCardDisplay.heading = { title: `${teamId} won the toss and elected to do ${decision}.` }
          }
          //if its a second inning
          else {
            let teamFunc = [redisClient.getAsync(`team${teamId}::score`), redisClient.getAsync(`team${teamId}::wicket`)]
            Promise.all(teamFunc)
              .then((res) => {
                scoreCardDisplay.heading = { totalScore: res[0], totalWicket: res[1] }
              })
              .catch((err) => { console.log(err) })
          }

          let funArr = [redisClient.getAsync(`team1::name`),
          redisClient.getAsync(`team2::name`),
          redisClient.getAsync(`current::striker`),
          redisClient.getAsync(`current::nonStriker`),
          redisClient.getAsync(`current::bowler`)
          ]
          Promise.all(funArr)
            .then((res) => {
              scoreCardDisplay.team1 = {
                name: res[0].name,
                logo: res[0].logo,
              }
              scoreCardDisplay.team2 = {
                name: res[1].name,
                logo: res[1].logo,
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
                  scoreCardDisplay.striker = {
                    name: resPlayer[0].name,
                    runs: resPlayer[0].runScored,
                    balls: resPlayer[0].ballsFaced,
                    fours: resPlayer[0].fours,
                    sixes: resPlayer[0].sixes
                  }
                  scoreCardDisplay.nonStriker = {
                    name: resPlayer[1].name,
                    runs: resPlayer[1].runScored,
                    balls: resPlayer[1].ballsFaced,
                    fours: resPlayer[1].fours,
                    sixes: resPlayer[1].sixes
                  }
                  scoreCardDisplay.bowler = {
                    name: resPlayer[2].name,
                    runsGiven: resPlayer[2].runsGiven,
                    overs: `${resPlayer[2].overs / 6}.${resPlayer[2].overs % 6}`,
                    maidein: resPlayer[2].maiden,
                    wickets: resPlayer[2].wickets,
                  }
                  scoreCardDisplay.overArray = resPlayer[3]

                  console.log("kkjj............", resPlayer[4])
                  let batsmanBoard = {}
                  let playerArr = []
                  async.each(resPlayer[4], (i, cb) => {
                    redisClient.hgetallAsync(`team${battingTeam}::player${i}`)
                      .then(function (res) {
                       
                        playerArr.push({
                          name: res.name,
                          runs: res.runScored,
                          balls: res.ballsFaced,
                          fours: res.fours,
                          sixes: res.sixes
                        })
                        cb()

                      })
                      .catch(err => {
                        console.log(err)
                        cb()
                      })

                  }, () => {
                    scoreCardDisplay.batsmanBoard = playerArr;
                    console.log("scorecard",scoreCardDisplay)
                    global.userSocket.emit("initialize", scoreCardDisplay)
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