const express = require('express');
const router = express.Router();
const controller = require("./../sequelize/controller/image.controller");
const kit = require('./../kit');

/**
 * 图片
 * @returns 
 */
module.exports = () => {
    router.post('/upload/goods', kit.uploadImgFn().single('goods'), controller.create);
    router.post('/upload/user', kit.uploadImgFn().single('user'), controller.create);
    router.delete('/delete/:id', controller.delete);
    router.post('/list', controller.list);
    router.post('/list/all', controller.listAll);
    return router;
}
