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

// redisClient.setAsync("match::status",1)
// .then(res => {console.log(res)})
const getKey = (key) => {
    redisClient.keysAsync("team1::player*")
        .then(res => {
            console.log(res)
        })
        .catch(err => console.log(err))
}

const deleteKeys = () => {
    redisClient.keysAsync("team1::player*")
        .then(res => {
            console.log(res)
            res.map(i => {
                console.log(i)
                redisClient.del(i)
                    .then(res => console.log(res))
                    .catch(err => console.log(err))

            })
        })
        .catch(err => console.log(err))
}

//deleteKeys()

redisClient.on('error', function (err) {
    console.log('Error connecting to redis : ' + err);
});