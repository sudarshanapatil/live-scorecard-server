const extra = (socket, redisClient) => {
    //Extra ball like wide,noBall
    socket.on("extra", data => {
        let { score, teamId, type } = data;
        redisClient.incrbyAsync(`team${teamId}::extra`, score + 1)
            .catch((err) => { console.log("err: ", err) })

        //update over array
        redisClient.rpushAsync('current::over', `${score}${type}`)
            .then((res) => { console.log("res: ", res) })
            .catch((err) => { console.log("err: ", err) })
    })
}

module.exports = extra;