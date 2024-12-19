const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require("./../../config/db.config.json");
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    // 设置时区为东八区(国内标准时区)
    timezone: '+08:00',
});
const md5 = require('js-md5');
const kit = require('./../../kit.js');

const db = {};
const sequelize_config = { Sequelize, sequelize, DataTypes, };
Object.assign(db, sequelize_config);

const model_list = [
    {
        name: "user",
        model: require("./user.model.js"),
    },
    {
        name: "goods_brand",
        model: require("./goods-brand.model.js"),
    },
    {
        name: "goods",
        model: require("./goods.model.js"),
    },
    {
        name: "image",
        model: require("./image.model.js"),
    },
    {
        name: "blackTokenList",
        model: require("./black-token-list.model.js"),
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

const UserModel = db['user'];
sequelize.sync().then(async () => {
    try {
        const userCount = await UserModel.count();
        if(userCount === 0) {
            const phone = "13100000000";
            const password = "000000";
            const pwd = md5(password);
            await UserModel.create({
                phone, 
                password: kit.md5(`${ phone }${ pwd }`), 
                nickname: "超级管理员",
                role: "0",
            });
            kit.createLogContentFn({
                path: "sequelize.sync", 
                msg: "预设用户已创建成功",
            });
        }
        
    } catch (error) {
        kit.createLogContentFn({
            path: "sequelize.sync", 
            msg: "预设用户已创建失败",
            error,
        });
    }

    console.log("数据库同步成功");
}).catch(err => {
    console.log("数据库同步失败", err);
})

module.exports = db;
