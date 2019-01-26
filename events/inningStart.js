
const inningStart = (socket, redisClient) => {
    //after toss when match starts
    socket.on('inningStart', data => {
        console.log("match started", data)
        //send data to UserBoard
        try {  //added try catch if user is not connected
            global.userSocket.emit(`inningStart`, data)
        }
        catch (e) {
            console.log(e)
        }
        let { strikerId, nonStrikerId, teamId, inningId } = data;
        let funcArr = [redisClient.setAsync('current::striker', strikerId),
        redisClient.setAsync('current::nonStriker', nonStrikerId),
        redisClient.setAsync(`team${teamId}::totalballs`, 0),
        redisClient.setAsync(`current::inning`, inningId),
        redisClient.saddAsync([`team${teamId}::playedBatsman`, strikerId, nonStrikerId])] //stores list of batsman played till now

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