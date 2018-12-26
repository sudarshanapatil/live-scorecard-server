const redis = require('redis');
const conf = require("./conf/dev.conf")
const Bluebird = require('bluebird')

// Redis client
const redisClient = redis.createClient({
    host: conf.host,
    port: conf.port,
    no_ready_check: true,
    auth_pass: conf.auth_pass
});

Bluebird.promisifyAll(redis.RedisClient.prototype);

// Connection to redis
redisClient.on('connect', err => {
    console.log('Connected to redis');
});

redisClient.setAsync("match::status",1)
.then(res => {console.log(res)})
// redisClient.keysAsync("*")
//     .then(res => {
//         console.log(res)
//         res.map(i=>{
//             redisClient.delAsync(i)
//             .then(res=>console.log(res))
//             .catch(err => console.log(err))
//            // console.log(i,"===")
//         })
//     })
//     .catch(err => console.log(err))
redisClient.on('error', function (err) {
    console.log('Error connecting to redis : ' + err);
});