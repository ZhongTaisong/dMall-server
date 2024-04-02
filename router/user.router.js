const userController = require("./../sequelize/controller/user.controller");

/**
 * 用户
 * @param {*} router 路由实例
 * @returns 
 */
module.exports = (router) => {
    /** 注册 */
    router.post('/public/register', userController.create);
    /** 登录 */
    router.post('/public/login', userController.login);
    /** 删除指定用户 */
    router.delete('/public/delete/:id', userController.delete);
    /** 更新指定用户 */
    router.put('/public/update', userController.update);
    /** 根据筛选条件查询用户 */
    router.post('/public/findAll', userController.findAll);
    return router;
}
