const wicket = (socket, redisClient) => {
    socket.on("wicket", data => {
        let { wicketBy, wicketType, playerId, teamId, newPlayer, role, bowlerId } = data;

        //set new batsman
        redisClient.setAsync(`current::${role}`, newPlayer)
            .catch((err) => { console.log("err: ", err) })

        //update total wickets by bowler
        redisClient.hgetallAsync(`team${teamId}::player${bowlerId}`)
            .then(function (res) {
                console.log("res: ", res)
                res.wickets++;
                redisClient.hmsetAsync(`team${teamId}::player${bowlerId}`, res)
                    .catch((err) => { console.log("err: ", err) })
            })
            .catch((err) => { console.log("err: ", err) })

        //wicket list update
        redisClient.incrbyAsync(`team${teamId}::wicket`, 1)

        //store the info how the batsman is out
        redisClient.hmsetAsync(`team${teamId}::player${playerId}`, { wicketBy, wicketType })
            .catch((err) => { console.log("err: ", err) })

        //update over array
        redisClient.rpushAsync('current::over', "W")
            .then((res) => { console.log("res: ", res) })
            .catch((err) => { console.log("err: ", err) })    
    })
}

module.exports = wicket;