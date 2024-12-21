const express = require('express');
const router = express.Router();
const controller = require("./../sequelize/controller/goods.controller");

/**
 * 商品
 * @returns 
 */
module.exports = () => {
    router.post('/add', controller.create);
    router.delete('/delete/:id', controller.delete);
    router.put('/update', controller.update);
    router.post('/list', controller.list);
    router.post('/public/list', controller.list);
    return router;
}
