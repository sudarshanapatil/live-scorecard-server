const inningEnd = (socket, redisClient) => {
    socket.on("inningEnd", data => {
        //TODO change batting team
        //At end of every inning update the total score of team and make all current keys null
        console.log("inning end")
        //send data to UserBoard
        try { global.userSocket.emit(`inningEnd`, data) }
        catch (e) { console.log(e) }

        let { teamId, totalScore, totalWicket, inningId } = data;
        console.log('Status : ', status);
        if (inningId == 2) {

            Promise.all([redisClient.setAsync(`team1::score`, 0),
            redisClient.setAsync(`team2::score`, 0),
            redisClient.setAsync(`team1::wickets`, 0),
            redisClient.setAsync(`team2::wickets`, 0),
            redisClient.setAsync(`match::overs`, 0),
            redisClient.mhsetAsync(`team1::info`, { teamName: "", teamLogo: "" }),
            redisClient.mhsetAsync(`team1::info`, { teamName: "", teamLogo: "" })])
                .then(res => console.log(res))
                .catch(err => console.log(err))

        }
        redisClient.setAsync(`team${teamId}::score`, totalScore)
            .catch((err) => { console.log("err: ", err) })
        redisClient.setAsync(`team${teamId}::wicket`, totalWicket)
            .catch((err) => { console.log("err: ", err) })
    })
}

module.exports = inningEnd;