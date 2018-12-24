
const inningStart = (socket, redisClient) => {
    //after toss when match starts
    socket.on('inningStart', data => {
        console.log("match started", data)
        let { strikerId, nonStrikerId, teamId, inningId } = data;
        let heading = {};
        let funcArr = [redisClient.setAsync('current::striker', strikerId),
        redisClient.setAsync('current::nonStriker', nonStrikerId),
        redisClient.setAsync(`team${teamId}::totalballs`, 0),
        redisClient.setAsync(`current::inning`, inningId),
        redisClient.saddAsync(`team${teamId}::playedBatsman`, playerId)] //stores list of batsman played till now
        
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