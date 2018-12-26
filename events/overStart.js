const overStart = (socket, redisClient) => {
    //At start of each over
    //bowlerDEails aksahy ko chahiye or strik pe kaun hai or total runs
    socket.on("overStart", data => {
        console.log("over start")
        let { bowlerId, strikerId, nonStrikerId, overId, teamId } = data;
        Promise.all([redisClient.hgetallAsync(`team${teamId}::player${bowlerId}`),
        redisClient.getAsync(`current::striker`),
        redisClient.getAsync(`team${teamId}::score`),
        ])
            .then((res) => {
                let dataToUser = {}
                dataToUser.bowler = {
                    name: res[0].name,
                    runsGiven: res[0].runsGiven,
                    ballsBowled: res[0].overs,
                    maiden: res[0].maiden,
                    wickets: res[0].wickets
                }
                dataToUser.strikerId = res[1]
                dataToUser.runs = res[2]
                global.userSocket.emit(`overStart`, dataToUser)
            })
        //check maiden over
        redisClient.lrangeAsync('current::over', 0, -1)
            .then((res) => {
                let isMaiden = res.every((i) => {
                    return (i == 0);
                })
                //Increament maidenCount for bowler
                if (isMaiden) {
                    redisClient.getAsync(`current::bowler`)
                        .then((oldBowlerId) => {
                            return redisClient.hgetallAsync(`team${teamId}::player${oldBowlerId}`)
                        })
                        .then(function (res) {
                            console.log("res: ", res)
                            res.maidenOvers++;
                            const funcArr = [
                                redisClient.hmsetAsync(`team${teamId}::player${oldBowlerId}`, res),
                                redisClient.setAsync('current::bowler', bowlerId)
                            ]
                            return Promise.all(funcArr)
                        })
                        .catch((err) => { console.log("err: ", err) })
                }
            })
            .catch((err) => { console.log("err: ", err) })
        //Update new over with all runs given by bowler as 0
        // redisClient.rpushAsync(['current::over', 0, 0, 0, 0, 0, 0])
        //     .then((res) => { console.log("res: ", res) })
        //     .catch((err) => { console.log("err: ", err) })
        if (overId != 0) {
            //swap striker and nonStriker
            redisClient.setAsync('current::striker', nonStrikerId)
                .catch((err) => { console.log("err: ", err) })
            redisClient.setAsync('current::nonStriker', strikerId)
                .catch((err) => { console.log("err: ", err) })
        }
    })

}

module.exports = overStart;