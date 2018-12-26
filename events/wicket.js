const wicket = (socket, redisClient) => {
    //After wicket update batsman,increament bowlers wicketCount,
    //store how batsman is out,maintain list of batsman till played

    socket.on("wicket", data => {
        let { wicketBy, wicketType, playerId, teamId, newPlayerId, newPlayerName, strikerId, bowlerId, runScored } = data;
        let oppositeTeamId = 1
        if (teamId == 1)
            oppositeTeamId = 2
        global.userSocket.emit("wicket", data)
        //update total wickets by bowler
        redisClient.hgetallAsync(`team${oppositeTeamId}::player${bowlerId}`)
            .then(function (res) {
                console.log("res: ", res)
                res.wickets++;
                return redisClient.hmsetAsync(`team${oppositeTeamId}::player${bowlerId}`, res)

            })
            .catch((err) => { console.log("err: ", err) })

        const funcArr = [redisClient.incrbyAsync(`team${teamId}::wicket`, 1), //wicket list update
        redisClient.hmsetAsync(`team${teamId}::player${playerId}`, { wicketBy, wicketType }), //store the info how the batsman is out
        redisClient.saddAsync(`team${teamId}::playedBatsman`, playerId), //stores list of batsman played till now
        redisClient.rpushAsync('current::over', "W"), //update over array
        redisClient.setAsync(`current::striker`, strikerId) //set new batsman
        ]
        Promise.all(funcArr)
            .catch((err) => { console.log("err: ", err) })
    })
}

module.exports = wicket;