const express = require('express');
const router = express.Router();
const controller = require("./../sequelize/controller/user.controller");

/**
 * 用户
 * @returns 
 */
module.exports = () => {
    /**
     * @swagger
     * /api/user/public/register:
     *   post:
     *     summary: 注册
     *     description: 注册
     *     tags:
     *      - 用户
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             required:
     *               - phone
     *               - password
     *             type: object
     *             properties:
     *               phone:
     *                 type: string
     *                 description: 手机号
     *                 example: 13100000000
     *               password:
     *                 type: string
     *                 description: 用户密码
     *                 example: 123456
     *               nickname:
     *                 type: string
     *                 description: 昵称
     *                 example: null
     *               avatar:
     *                 type: string
     *                 description: 用户头像
     *                 example: null
     *     responses:
     *       200:
     *         description: 成功响应
     *       400:
     *         description: 缺少必要参数
     *       500:
     *         description: 服务端出错了
     */
    router.post('/public/register', controller.create);

    /**
     * @swagger
     * /api/user/public/login:
     *   post:
     *     summary: 登录
     *     description: 登录
     *     tags:
     *      - 用户
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             required:
     *               - phone
     *               - password
     *             type: object
     *             properties:
     *               phone:
     *                 type: string
     *                 description: 手机号
     *                 example: 13100000000
     *               password:
     *                 type: string
     *                 description: 用户密码
     *                 example: 123456
     *     responses:
     *       200:
     *         description: 成功响应
     *       400:
     *         description: 缺少必要参数
     *       500:
     *         description: 服务端出错了
     */
    router.post('/public/login', controller.login);

    /**
     * @swagger
     * /api/user/public/delete/{id}:
     *   delete:
     *     summary: 删除指定用户
     *     description: 删除指定用户
     *     tags:
     *      - 用户
     *     parameters:
     *       - name: id
     *         in: path
     *         description: 主键id
     *         required: true
     *         schema: 
     *           type: string
     *           example: 123
     *     responses:
     *       200:
     *         description: 成功响应
     *       400:
     *         description: 缺少必要参数
     *       500:
     *         description: 服务端出错了
     */
    router.delete('/public/delete/:id', controller.delete);

    /**
     * @swagger
     * /api/user/public/update:
     *   put:
     *     summary: 更新指定用户
     *     description: 更新指定用户
     *     tags:
     *      - 用户
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             required:
     *               - id
     *             type: object
     *             properties:
     *               id:
     *                 type: string
     *                 description: 主键id
     *                 example: 123
     *               nickname:
     *                 type: string
     *                 description: 昵称
     *                 example: null
     *               avatar:
     *                 type: string
     *                 description: 用户头像
     *                 example: null
     *     responses:
     *       200:
     *         description: 成功响应
     *       400:
     *         description: 缺少必要参数
     *       500:
     *         description: 服务端出错了
     */
    router.put('/public/update', controller.update);

    /**
     * @swagger
     * /api/user/public/findAll:
     *   post:
     *     summary: 根据筛选条件查询用户
     *     description: 根据筛选条件查询用户
     *     tags:
     *      - 用户
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               id:
     *                 type: string
     *                 description: 主键id
     *                 example: 123
     *               phone:
     *                 type: string
     *                 description: 手机号
     *                 example: 13100000000
     *               nickname:
     *                 type: string
     *                 description: 昵称
     *                 example: null
     *     responses:
     *       200:
     *         description: 成功响应
     *       400:
     *         description: 缺少必要参数
     *       500:
     *         description: 服务端出错了
     */
    router.post('/public/findAll', controller.findAll);
    
    return router;
}
