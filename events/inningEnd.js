const inningEnd = (socket, redisClient) => {
    socket.on("inningEnd", data => {
        console.log("inning end")
        //current sab change to 0
        let { teamId, totalScore, totalWicket } = data;
        console.log('Status : ', status);
        redisClient.setAsync(`team${teamId}::score`, totalScore)
            .catch((err) => { console.log("err: ", err) })
        redisClient.setAsync(`team${teamId}::wicket`, totalWicket)
            .catch((err) => { console.log("err: ", err) })
    })
}

module.exports = inningEnd;