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
            set(value) {
                const val = String(value || "");
                if(!val) {
                    throw new Error('手机号不能为空');
                }
                
                const bol = kit.validatePhone(val);
                if(!bol) {
                    throw new Error('请输入合法的手机号');
                }
            
                this.setDataValue('phone', val);
            },
        },
        password: {
            type: DataTypes.STRING,
            comment: '用户密码',
            set(value) {
                const phone = this.getDataValue('phone');
                const val = String(value || "");
                if(!val) {
                    throw new Error('用户密码不能为空');
                }
                
                const { bol, tip, min, max, } = kit.validatePasswordFn(val);
                if(!bol) {
                    throw new Error(`请输入${ min }至${ max }位用户密码,密码${ tip }`);
                }
            
                const pwd = kit.md5(`${ phone }${ val }`);
                this.setDataValue('password', pwd);
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
