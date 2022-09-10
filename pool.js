const mysql = require('mysql');

// 创建mysql连接池
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '12345678',
    database: 'dm',
    connectionLimit: 10,
    // 支持执行多条sql语句
    multipleStatements: true,
});

module.exports = pool;
