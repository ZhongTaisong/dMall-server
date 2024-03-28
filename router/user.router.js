const userController = require("./../sequelize/controller/user.controller");

/**
 * 用户
 * @param {*} router 路由实例
 * @returns 
 */
module.exports = (router) => {
    /** 注册 */
    router.post('/public/register', userController.create);
    /** 删除指定用户 */
    router.delete('/public/delete/:id', userController.delete);
    return router;
}
