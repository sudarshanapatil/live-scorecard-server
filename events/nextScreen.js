const nextScreen=(socket,redisClient)=>{
    socket.on('nextScreen', status => {
        console.log('Status : ', status);
        redisClient.setAsync('match:status', status);
      });
}

module.exports=nextScreen;