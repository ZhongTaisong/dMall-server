const express = require('express');
const router = express.Router();
const controller = require("./../sequelize/controller/user.controller");

/**
 * 用户
 * @returns 
 */
module.exports = () => {
    router.post('/add', controller.create);
    router.post('/public/register', controller.create);
    router.post('/public/login', controller.login);
    router.delete('/delete/:id', controller.delete);
    router.put('/update', controller.update);
    router.post('/list', controller.list);
    router.get('/logout', controller.logout);
    router.post('/resetPassword', controller.resetPassword);
    router.post('/changePassword', controller.changePassword);
    router.get('/info', controller.info);
    router.post('/info/update', controller.updateInfo);
    return router;
}
