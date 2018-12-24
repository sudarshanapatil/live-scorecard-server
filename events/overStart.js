const overStart = (socket, redisClient) => {
    //At start of each over
    socket.on("overStart", data => {
        console.log("ovr start")
        //TODO maiden over check and swap the striker with non striker
        let { bowlerId } = data;
        redisClient.setAsync('current::bowler', bowlerId)
        //TODO:To check update on key
        redisClient.rpushAsync('current::over', [0, 0, 0, 0, 0, 0])
            .then((res) => { console.log("res: ", res) })
            .catch((err) => { console.log("err: ", err) })
    })
}

module.exports = overStart;