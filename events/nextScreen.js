
const initializeEvent = require(`./initialize`)
const nextScreen = (socket, redisClient) => {
    //for front end to decide which screen to display
    socket.on('nextScreen', status => {
        console.log("nextStstus", status)
        redisClient.setAsync('match::status', status)
        .catch((err) => console.log(err))
        userSocket.emit(parseInt(status))
        // if (status == 2) {
        //     Promise.all([`team1::name`, `team2::name`])
        //         .then(res => {
        //             global.userSocket.emit("nextScreen", {
        //                 status: status,
        //                 team1Name: res[0],
        //                 team2Name: res[1]
        //             })
        //         })
        // }
        // else if (status == 3 ^ status == 4) {
        //     teamId = 1
        //     if (status == 4)
        //         teamId = 2

        //     let nameArr = []
        //     redisClient.keysAsync(`team${teamId}::player*`)
        //         .then(res => {
        //             res.map(i => {
        //                 redisClient.hmgetAsync(i)
        //                     .then(res => {
        //                         nameArrp.push(res.name)
        //                     })
        //             })
        //             global.userSocket.emit(`nextScreen`,{team:teamId,names:nameArr})
        //         })
        // }

        // else if (status == 6) { //send data to UserBoard
        //     initializeEvent(global.userSocket, redisClient)
        // }
       
    });
}

module.exports = nextScreen;