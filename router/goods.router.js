const express = require('express');
const router = express.Router();
const controller = require("./../sequelize/controller/goods.controller");
const kit = require('./../kit');

/**
 * 商品
 * @returns 
 */
module.exports = () => {
    /**
     * @swagger
     * /api/goods/public/formData/add:
     *   post:
     *     summary: 新增商品 - FormData
     *     description: 新增商品 - FormData
     *     tags:
     *      - 商品
     *     requestBody:
     *       content:
     *         multipart/form-data:
     *           schema:
     *             required:
     *               - goods_name
     *             type: object
     *             properties:
     *               goods_name:
     *                 type: string
     *                 description: 商品名称
     *                 example: 商品666
     *               goods_description:
     *                 type: string
     *                 description: 商品描述
     *                 example: ""
     *               goods_price:
     *                 type: number
     *                 format: decimal
     *                 description: 商品价格
     *                 example: 88.88
     *               goods_imgs:
     *                 type: array
     *                 description: 商品头像
     *                 items: 
     *                   type: string
     *                   format: binary
     *               goods_detail:
     *                 type: string
     *                 description: 商品详情
     *                 example: ""
     *     responses:
     *       200:
     *         description: 成功响应
     *       400:
     *         description: 缺少必要参数
     *       500:
     *         description: 服务端出错了
     */
    router.post('/public/formData/add', kit.upload().array('goods_imgs', 3), controller.formData_create);

    /**
     * @swagger
     * /api/goods/public/delete/{id}:
     *   delete:
     *     summary: 删除指定商品
     *     description: 删除指定商品
     *     tags:
     *      - 商品
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
     * /api/goods/public/update:
     *   put:
     *     summary: 更新指定商品 - FormData
     *     description: 更新指定商品 - FormData
     *     tags:
     *      - 商品
     *     requestBody:
     *       content:
     *         multipart/form-data:
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
     *                 example: ""
     *               avatar:
     *                 type: string
     *                 description: 商品头像
     *                 format: binary
     *     responses:
     *       200:
     *         description: 成功响应
     *       400:
     *         description: 缺少必要参数
     *       500:
     *         description: 服务端出错了
     */
    router.put('/public/formData/update', kit.upload().single('avatar'), controller.formData_update);

    /**
     * @swagger
     * /api/goods/public/findAll:
     *   post:
     *     summary: 根据筛选条件查询商品
     *     description: 根据筛选条件查询商品
     *     tags:
     *      - 商品
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
     *               goods_name:
     *                 type: string
     *                 description: 商品名称
     *                 example: 商品666
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
