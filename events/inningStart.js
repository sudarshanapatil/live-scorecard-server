
const inningStart = (socket, redisClient) => {
    //after toss when match starts
    socket.on('inningStart', data => {
        console.log("match started", data)
        let { strikerId, nonStrikerId, teamId, inningId } = data;
        let heading = {};
        let funcArr = [redisClient.setAsync('current::striker', strikerId),
        redisClient.setAsync('current::nonStriker', nonStrikerId),
        redisClient.setAsync(`team${teamId}::totalballs`, 0),
        redisClient.setAsync(`current::inning`, inningId)]
        if (inningId == 1) {
            redisClient.hgetallAsync("team::toss")
                .then((res) => {
                    
                    heading = { title: `${res.teamId} won the toss and elected to do ${res.decision}.` }
                })
           
        }
        else
            heading = { totalScore: 500, totalWicket: 7 }
        Promise.all(funcArr)
            .then((res) => {
                console.log(res)
            })
            .catch((err) => {
                console.log(err)
            })
    })
}

module.exports = inningStart;