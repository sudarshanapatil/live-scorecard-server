const overStart = (socket, redisClient) => {
    //At start of each over
    socket.on("overStart", data => {
        console.log("ovr start")
        let { oldBowlerId, bowlerId,strikerId,nonStrikerId } = data;

        //check maiden over
        redisClient.lrangeAsync('current::over', 0, -1)
            .then((res) => {
                let isMaiden = res.every((i) => {
                    return (i == 0);
                })
                //Increament maidenCount for bowler
                if (isMaiden) {
                    redisClient.hgetallAsync(`team${teamId}::player${oldBowlerId}`)
                        .then(function (res) {
                            console.log("res: ", res)
                            res.maidenOvers++;
                            redisClient.hmsetAsync(`team${teamId}::player${oldBowlerId}`, res)
                                .catch((err) => { console.log("err: ", err) })
                        })
                        .catch((err) => { console.log("err: ", err) })
                }
            })
            .catch((err) => { console.log("err: ", err) })

        //update currentBowler
        redisClient.setAsync('current::bowler', bowlerId)
        .catch((err) => { console.log("err: ", err) })

        //Update new over with all runs given by bowler as 0
        redisClient.rpushAsync(['current::over', 0, 0, 0, 0, 0, 0])
            .then((res) => { console.log("res: ", res) })
            .catch((err) => { console.log("err: ", err) })

        //swap striker and nonStriker
        redisClient.setAsync('current::striker', nonStrikerId)
        .catch((err) => { console.log("err: ", err) })
        redisClient.setAsync('current::nonStriker', strikerId)
        .catch((err) => { console.log("err: ", err) })
    })

}

module.exports = overStart;