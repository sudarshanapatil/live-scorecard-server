const initialize = (socket,redisClient) => {
    redisClient.getAsync('match:status')
      .then((res) => {
        let value;
        if (res) {
          value = res.value;
        } else {
          value = 1;
        }
        socket.emit('initialize', value);
      })
      .catch((err) => console.log('Error : ', err))
  }
   
  module.exports=initialize;