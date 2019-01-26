const wicket = (socket, redisClient) => {
    //After wicket update batsman,increament bowlers wicketCount,
    //store how batsman is out,maintain list of batsman till played

    socket.on("wicket", data => {
        let { wicketBy, wicketType, playerId, teamId, newPlayerId, newPlayerName, strikerId, bowlerId, runScored } = data;
        //rungiven teamscore player
        let oppositeTeamId = 1;
        if (teamId == 1)
            oppositeTeamId = 2;
        try {
            global.userSocket.emit("wicket", data)
        }
        catch (e) {
            console.log(e)
        }
        //update total wickets by bowler and runs given
        redisClient.hgetallAsync(`team${oppositeTeamId}::player${bowlerId}`)
            .then(function (res) {
                console.log("res: ", res)
                res.wickets++;
                res.runsGiven += runScored;
                res.bowled++;
                return redisClient.hmsetAsync(`team${oppositeTeamId}::player${bowlerId}`, res)

            })
            .catch((err) => { console.log("err: ", err) })
        //update run given
        const funcArr = [redisClient.hgetallAsync(`team${teamId}::player${playerId}`),//store the info how the batsman is out and score
        redisClient.incrbyAsync(`team${teamId}::wicket`, 1), //wicket list update
        redisClient.saddAsync(`team${teamId}::playedBatsman`, playerId), //stores list of batsman played till now
        redisClient.rpushAsync('current::over', "W"), //update over array
        redisClient.setAsync(`current::striker`, strikerId),//set new batsman
        redisClient.incrbyAsync(`team${teamId}::score`, runScored) //increase score of player
        ]
        Promise.all(funcArr)
            .then(res => {
                res[0].runScored = runScored;
                res[0].wicketBy = wicketBy;
                res[0].wicketType = wicketType;
                redisClient.hmsetAsync(`team${teamId}::player${playerId}`, res[0])
            })
            .catch((err) => { console.log("err: ", err) })
    })
}

module.exports = wicket;