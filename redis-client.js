const redis = require("redis");

// 创建redis客户端
const client = redis.createClient();

// 监听redis成功连接
client.on('connect', function() {
    console.log('Redis客户端已连接!');
});

// 监听redis错误
client.on('error', function(err) {
    // console.log('Redis客户端错误!', err);
});

// 连接redis
client.connect();

module.exports = client;
