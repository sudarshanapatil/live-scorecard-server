const revert=(socket,redisClient)=>{
    //for front end to decide which screen to display
    socket.on('revert', status => {
        console.log('in revert : ', status);
        redisClient.setAsync('match::status', status);
      });
}

module.exports=revert;