const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require("./../../config/db.config.json");
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    // 设置时区为东八区(国内标准时区)
    timezone: '+08:00',
});

const db = {};
const sequelize_config = { Sequelize, sequelize, DataTypes, };
Object.assign(db, sequelize_config);

const model_list = [
    {
        name: "user",
        model: require("./user.model.js"),
    },
];
model_list.forEach(item => {
    const { name, model, } = item;
    if(name && typeof model === 'function') {
        Object.assign(db, {
            [name]: model(sequelize, DataTypes),
        });
    }
})

sequelize.sync().then(() => {
    console.log("数据库同步成功");
}).catch(err => {
    console.log("数据库同步失败", err);
})

module.exports = db;
