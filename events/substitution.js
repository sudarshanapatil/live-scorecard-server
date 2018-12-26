const substitution = (socket, redisClient) => {
    //for front end to decide which screen to display
    socket.on('substitution', data => {
        let { } = data
        console.log('in substitution : ', data);
    });
}

module.exports = substitution;