const initialize = (socket, redisClient) => {
 //Initial event
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
    .then((res) => {
      redisClient.hgetallAsync("team::toss")
        .then((resToss) => {
          let { battingTeam, teamId, decision } = resToss;

          //if its a First inning get info who own d toss
          if (res == 1) {
            heading = { title: `${teamId} won the toss and elected to do ${decision}.` }
          }
          //if its a second inning
          else {
            let teamFunc = [redisClient.getAsync(`team${teamId}::score`), redisClient.getAsync(`team${teamId}::wicket`)]
            Promise.all(teamFunc)
              .then((res) => {
                heading = { totalScore: res[0], totalWicket: res[1] }
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
              scoreCardDisplay.team1 = {
                name: res[0].name,
                logo: res[0].logo,
              }
              scoreCardDisplay.team2 = {
                name: res[1].name,
                logo: res[1].logo,
              }

              let strikerId = res[2];
              let nonStrikerId = res[3];
              let bowlerId = res[4];
              let playerFunc = [redisClient.hgetallAsync(`team${battingTeam}::player${strikerId}`),
              redisClient.hgetallAsync(`team${battingTeam}::player${nonStrikerId}`),
              redisClient.hgetallAsync(`team${battingTeam}::player${bowlerId}`)
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
                  global.userSocket.emit("initialize", scoreCardDisplay)
                })
                .catch((err) => { console.log(err) })
            })
            .catch((err) => { console.log(err) })
        })
        .catch((err) => { console.log(err) })
    })


}

module.exports = initialize;