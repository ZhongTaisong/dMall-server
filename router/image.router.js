const express = require('express');
const router = express.Router();
const controller = require("./../sequelize/controller/image.controller");
const kit = require('./../kit');

/**
 * 图片
 * @returns 
 */
module.exports = () => {
    router.post('/upload/goods', kit.uploadImgFn().array('goodsImgs', 6), controller.create);
    router.post('/upload/user', kit.uploadImgFn().array('user', 1), controller.create);
    router.delete('/delete/:id', controller.delete);
    router.post('/list', controller.list);
    router.post('/list/all', controller.listAll);
    return router;
}
