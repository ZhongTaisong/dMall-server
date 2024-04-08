const express = require('express');
const router = express.Router();
const controller = require("./../sequelize/controller/user.controller");

/**
 * 用户
 * @returns 
 */
module.exports = () => {
    /** 注册 */
    router.post('/public/register', controller.create);
    /** 登录 */
    router.post('/public/login', controller.login);
    /** 删除指定用户 */
    router.delete('/public/delete/:id', controller.delete);
    /** 更新指定用户 */
    router.put('/public/update', controller.update);
    /** 根据筛选条件查询用户 */
    router.post('/public/findAll', controller.findAll);
    return router;
}
