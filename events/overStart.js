const overStart = (socket, redisClient) => {
    //At start of each over
    //bowlerDEails aksahy ko chahiye or strik pe kaun hai or total runs
    socket.on("overStart", data => {
        console.log("over start")

        let { bowlerId, strikerId, nonStrikerId, overId, teamId } = data;
        let oppositeTeamId = 1
        if (teamId == 1)
            oppositeTeamId = 2

        //To send data to user    
        Promise.all([redisClient.hgetallAsync(`team${oppositeTeamId}::player${bowlerId}`),
        redisClient.getAsync(`current::striker`),
        redisClient.getAsync(`team${teamId}::score`),
        ])
            .then((res) => {
                global.userSocket.emit(`overStart`, {
                    bowler: {
                        name: res[0].name,
                        runsGiven: res[0].runsGiven,
                        ballsBowled: res[0].overs,
                        maiden: res[0].maiden,
                        wickets: res[0].wickets
                    },
                    strikerId: res[1],
                    runs: res[2]
                })
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
                            return redisClient.hgetallAsync(`team${oppositeTeamId}::player${oldBowlerId}`)
                        })
                        .then(function (res) {
                            console.log("res: ", res)
                            res.maidenOvers++;
                            const funcArr = [
                                redisClient.hmsetAsync(`team${oppositeTeamId}::player${oldBowlerId}`, res),
                                redisClient.setAsync('current::bowler', bowlerId)
                            ]
                            return Promise.all(funcArr)
                        })
                        .catch((err) => { console.log("err: ", err) })
                }
            })
            .catch((err) => { console.log("err: ", err) })

        if (overId != 0) {
            //swap striker and nonStriker
            Promise.all([redisClient.setAsync('current::striker', nonStrikerId),
            redisClient.setAsync('current::nonStriker', strikerId)])
                .catch((err) => { console.log("err: ", err) })
        }
    })

}

module.exports = overStart;