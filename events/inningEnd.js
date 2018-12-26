const inningEnd = (socket, redisClient) => {
    socket.on("inningEnd", data => {
        //At end of every inning update the total score of team and make all current keys null
        console.log("inning end")
        //send data to UserBoard
        global.userSocket.emit(`inningEnd`, data)

        let { teamId, totalScore, totalWicket } = data;
        console.log('Status : ', status);
        redisClient.setAsync(`team${teamId}::score`, totalScore)
            .catch((err) => { console.log("err: ", err) })
        redisClient.setAsync(`team${teamId}::wicket`, totalWicket)
            .catch((err) => { console.log("err: ", err) })
    })
}

module.exports = inningEnd;