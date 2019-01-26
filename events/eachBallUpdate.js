const eachBallUpdate = (socket, redisClient) => {
    //Updates batsman runScored and ballsFaced checks for 4s and 6s,
    //swaps striker and nonstriker if needed
    //bowlers runsGiven,overs
    //updates runs in overArray of bowler

    socket.on("eachBallUpdate", data => {
        console.log(data, "eachballupdate")
        //send data to UserBoard
        try {
            global.userSocket.emit(`eachBallUpdate`, data)
        }
        catch (e) {
            console.log(e)
        }
        //playerId is who played the last ball
        //strikerId is now who is on strike
        let { runScored, teamId, playerId, strikerId, bowlerId, nonStrikerId } = data;

        //increase runs of player and balls faced
        redisClient.hgetallAsync(`team${teamId}::player${playerId}`)
            .then(function (res) {
                console.log("res: ", res)
                res.runScored += runScored;
                res.ballsFaced += ballsFaced;
                redisClient.hmsetAsync(`team${teamId}::player${playerId}`, res)
                    .catch((err) => { console.log("err: ", err) })
            })
            .catch((err) => { console.log("err: ", err) })

        //change the Striker
        if (strikerId) {
            redisClient.setAsync(`current::striker`, strikerId)
                .catch((err) => { console.log("err: ", err) })
            redisClient.setAsync(`current::nonStriker`, nonStrikerId)
                .catch((err) => { console.log("err: ", err) })
        }

        //if player played 4 or 6
        if (parseInt(runScored) == 4) {
            redisClient.hgetallAsync(`team${teamId}::player${playerId}`)
                .then(function (res) {
                    console.log("res: ", res)
                    res.fours++;
                    redisClient.hmsetAsync(`team${teamId}::player${playerId}`, res)
                        .catch((err) => { console.log("err: ", err) })
                })
                .catch((err) => { console.log("err: ", err) })
        }
        else if (parseInt(runScored) == 6) {
            redisClient.hgetallAsync(`team${teamId}::player${playerId}`)
                .then(function (res) {
                    console.log("res: ", res)
                    res.sixes++;
                    redisClient.hmsetAsync(`team${teamId}::player${playerId}`, res)
                        .catch((err) => { console.log("err: ", err) })
                })
                .catch((err) => { console.log("err: ", err) })
        }

        //update runsGiven and totalOvers of bowler
        let oppositeTeamId = 1
        if (teamId == 1)
            oppositeTeamId = 2
        redisClient.hgetallAsync(`team${oppositeTeamId}::player${bowlerId}`)
            .then(function (res) {
                console.log("res: ", res)
                res.runsGiven += runScored;
                res.bowled++;
                redisClient.hmsetAsync(`team${oppositeTeamId}::player${bowlerId}`, res)
                    .catch((err) => { console.log("err: ", err) })
            })
            .catch((err) => { console.log("err: ", err) })

        //increament totalBalls of team
        redisClient.incrbyAsync(`team${teamId}::totalBalls`, 1)
            .catch((err) => { console.log("err: ", err) })
        //increament totalScore of team
        redisClient.incrbyAsync(`team${teamId}::score`, runScored)
            .catch((err) => { console.log("err: ", err) })

        //update runs in over array
        redisClient.rpushAsync('current::over', runScored)
            .then((res) => { console.log("res: ", res) })
            .catch((err) => { console.log("err: ", err) })
    })
}

module.exports = eachBallUpdate;