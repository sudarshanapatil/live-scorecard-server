
const initializeEvent = require(`./initialize`)
const nextScreen = (socket, redisClient) => {
    //for front end to decide which screen to display
    socket.on('nextScreen', status => {
        console.log("nextStstus",status)
        console.log('Status : ', status);
        if (status == 5) { //send data to UserBoard
            initializeEvent(global.userSocket, redisClient, `user`)
        }
        redisClient.setAsync('match::status', status)
            .catch((err) => console.log(err))
    });
}

module.exports = nextScreen;