const nextScreen=(socket,redisClient)=>{
    //for front end to decide which screen to display
    socket.on('nextScreen', status => {
        console.log('Status : ', status);
        redisClient.setAsync('match::status', status);
      });
}

module.exports=nextScreen;