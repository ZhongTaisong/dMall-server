/**
 * 商品表 - 创建
 * @param {*} sequelize 实例
 * @param {*} DataTypes 数据类型
 * @returns 
 */
const TABLE_NAME = "dm_goods";
module.exports = (sequelize, DataTypes) => {
    return sequelize.define(TABLE_NAME, {
        goods_name: {
            type: DataTypes.STRING,
            comment: '商品名称',
            set(value) {
                const val = String(value || "");
                if(!val) {
                    throw new Error('商品名称不能为空');
                }
            
                this.setDataValue('goods_name', val);
            },
        },
        goods_description: {
            type: DataTypes.STRING,
            comment: '商品描述',
        },
        goods_price: {
            type: DataTypes.DECIMAL(10, 2),
            comment: '商品价格',
            set(value) {
                const val = Number(value || 0);
                if(Number.isNaN(val)) {
                    throw new Error('输入的商品价格只能是数字 且 保留两位小数');
                }
            
                this.setDataValue('goods_price', val);
            },
        },
        goods_img: {
            type: DataTypes.STRING,
            comment: '商品图片',
        },
        goods_detail: {
            type: DataTypes.STRING,
            comment: '商品详情',
        },
    }, {
        /** 表名称与模型名称一致 */
        freezeTableName: true,
        /** 启用时间戳 */
        timestamps: true,
    });
};
