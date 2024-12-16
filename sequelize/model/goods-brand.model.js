/**
 * 商品品牌 - 创建
 * @param {*} sequelize 实例
 * @param {*} DataTypes 数据类型
 * @returns 
 */
const TABLE_NAME = "dm_goods_brand";
module.exports = (sequelize, DataTypes) => {
    return sequelize.define(TABLE_NAME, {
        brand_name: {
            type: DataTypes.STRING(30),
            comment: '品牌名称',
            set(value) {
                const val = String(value || "");
                if(!val) {
                    throw new Error('品牌名称不能为空');
                }
                
                if(val.length > 30) {
                    throw new Error('品牌名称最多30个字符');
                }
            
                this.setDataValue('brand_name', val);
            },
        },
    }, {
        /** 表名称与模型名称一致 */
        freezeTableName: true,
        /** 启用时间戳 */
        timestamps: true,
    });
};
