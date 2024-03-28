/**
 * 用户表 - 创建
 * @param {*} sequelize 实例
 * @param {*} DataTypes 数据类型
 * @returns 
 */
module.exports = (sequelize, DataTypes) => {
    return sequelize.define("dm_user", {
        phone: {
            type: DataTypes.STRING(11),
            comment: '手机号',
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            comment: '用户密码',
            allowNull: false,
            unique: true,
        },
        nickname: {
            type: DataTypes.STRING,
            comment: '昵称',
            unique: true,
        },
        avatar: {
            type: DataTypes.STRING,
            comment: '用户头像',
            unique: true,
        },
    }, {
        /** 表名称与模型名称一致 */
        freezeTableName: true,
    });
};
