const express = require('express');
const router = express.Router();
const controller = require("./../sequelize/controller/goods-brand.controller");

/**
 * 商品品牌
 * @returns 
 */
module.exports = () => {
    /** 新增品牌 */
    router.post('/public/add', controller.create);
    /** 删除指定品牌 */
    router.delete('/public/delete/:id', controller.delete);
    /** 更新指定品牌 */
    router.put('/public/update', controller.update);
    /** 根据筛选条件查询品牌 */
    router.post('/public/findAll', controller.findAll);
    return router;
}
