let async = require("async")
const initialize = (socket, redisClient) => {
  //Initial event
  console.log(`Initializing..`)
  let scoreCardDisplay = {
    team1: {},
    team2: {}
  }

  redisClient.getAsync("current::inning")
    .then((resInning) => {
      scoreCardDisplay.inningId = parseInt(resInning);
      redisClient.hgetallAsync("team::toss")
        .then((resToss) => {
          let { battingTeam, teamId, decision } = resToss;
          scoreCardDisplay.toss = { teamId: teamId, decision: decision, battingTeam: battingTeam }
          let funArr = [redisClient.getAsync(`team1::name`),
          redisClient.getAsync(`team2::name`),
          redisClient.getAsync(`current::striker`),
          redisClient.getAsync(`current::nonStriker`),
          redisClient.getAsync(`current::bowler`),
          redisClient.getAsync(`team1::score`),
          redisClient.getAsync(`team1::wicket`),
          redisClient.getAsync(`team2::score`),
          redisClient.getAsync(`team2::wicket`),
          redisClient.getAsync('match::status'),
          getPlayers(1, redisClient),
          getPlayers(2, redisClient),
          redisClient.lrangeAsync("current::over", 0, -1),
          redisClient.smembersAsync(`team${teamId}::playedBatsman`),
          redisClient.getAsync(`match::overs`)
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
              scoreCardDisplay.totalOvers=res[14]
              let playerArr = []
              Promise.all(res[13].map(i => redisClient.hgetallAsync(`team${battingTeam}::player${i}`)))
                .then((res) => {
                  res.map(key => {
                    playerArr.push({
                      name: key.name,
                      runs: parseInt(key.runScored),
                      balls: parseInt(key.ballsFaced),
                      fours: parseInt(key.fours),
                      sixes: parseInt(key.sixes)
                    })
                  })
                })
                .catch((err) => { console.log(err) })

              let strikerId = res[2];
              let nonStrikerId = res[3];
              let bowlerId = res[4];
              scoreCardDisplay.team1.players = res[11];
              scoreCardDisplay.team2.players = res[12];
              scoreCardDisplay.overArray = res[13]
              scoreCardDisplay.matchStatus = 1;
              if (res[9])
                scoreCardDisplay.matchStatus = parseInt(res[9]);
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

              let playerFunc = [redisClient.hgetallAsync(`team${battingTeam}::player${strikerId}`),
              redisClient.hgetallAsync(`team${battingTeam}::player${nonStrikerId}`),
              redisClient.hgetallAsync(`team${battingTeam}::player${bowlerId}`),
              ]

              Promise.all(playerFunc)        //get Striker NonStriker and Bowler Details
                .then((resPlayer) => {
                  if (resPlayer[0]) {
                    scoreCardDisplay.striker = getPlayerDetails(strikerId, resPlayer[0])
                  }
                  if (resPlayer[1]) {
                    scoreCardDisplay.nonStriker = getPlayerDetails(nonStrikerId, resPlayer[1])
                  }
                  if (resPlayer[2]) {
                    scoreCardDisplay.bowler = getPlayerDetails(bowlerId, resPlayer[2])
                  }
                  scoreCardDisplay.batsmanBoard = playerArr;
                  console.log("scorecard...", scoreCardDisplay)
                  socket.emit('initialize', scoreCardDisplay);
                  socket.emit("initialize", scoreCardDisplay);
                })
                .catch((err) => { console.log(err) })
            })
            .catch((err) => { console.log(err) })
        })
        .catch((err) => { console.log(err) })
    })
}

const getPlayers = (teamId, redisClient) => new Promise((resolve, reject) => {
  redisClient.keysAsync(`team${teamId}::player*`)
    .catch(err => { console.log("Error : ", err) })
    .then(res => {
      return Promise.all(res.map(i => redisClient.hgetallAsync(i)))
        .then((mres) => {
          resolve(mres);
        })
        .catch((err) => {
          console.log(err)
          reject(err)
        })

    })
})

const getPlayerDetails = (data, id) => {
  let result = {
    id: parseInt(id),
    name: data.name,
    runsGiven: parseInt(data.runsGiven),
    ballsBowled: parseInt(data.overs),
    maiden: parseInt(data.maiden),
    wickets: parseInt(data.wickets),
    runs: parseInt(data.runScored),
    balls: parseInt(data.ballsFaced),
    fours: parseInt(data.fours),
    sixes: parseInt(data.sixes)
  }
  return result;
}
module.exports = initialize;