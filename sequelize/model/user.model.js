const kit = require('./../../kit');

/**
 * 用户表 - 创建
 * @param {*} sequelize 实例
 * @param {*} DataTypes 数据类型
 * @returns 
 */
module.exports = (sequelize, DataTypes) => {
    return sequelize.define("dm_user333", {
        phone: {
            type: DataTypes.STRING(11),
            comment: '手机号',
            allowNull: true,
            validate: {
                validator(value) {
                    if(!value) {
                        throw new Error('手机号不能为空');
                    }

                    const bol = kit.validatePhone(value);
                    if(!bol) {
                        throw new Error('请输入合法的手机号');
                    }
                },
            },
        },
        password: {
            type: DataTypes.STRING,
            comment: '用户密码',
            allowNull: true,
            validate: {
                validator(value) {
                    if(!value) {
                        throw new Error('用户密码不能为空');
                    }
                },
            },
        },
        nickname: {
            type: DataTypes.STRING,
            comment: '昵称',
        },
        avatar: {
            type: DataTypes.STRING,
            comment: '用户头像',
        },
    }, {
        /** 表名称与模型名称一致 */
        freezeTableName: true,
        /** 启用时间戳 */
        timestamps: true,
    });
};
