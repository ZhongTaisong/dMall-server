const express = require('express');
const router = express.Router();
const controller = require("./../sequelize/controller/goods-brand.controller");

/**
 * 商品品牌
 * @returns 
 */
module.exports = () => {
    /**
     * @swagger
     * /api/goods-brand/public/add:
     *   post:
     *     summary: 新增品牌
     *     description: 新增品牌
     *     tags:
     *      - 商品品牌
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             required:
     *               - brand_name
     *             type: object
     *             properties:
     *               brand_name:
     *                 type: string
     *                 description: 品牌名称
     *                 example: 某品牌
     *     responses:
     *       200:
     *         description: 成功响应
     *       400:
     *         description: 缺少必要参数
     *       500:
     *         description: 服务端出错了
     */
    router.post('/public/add', controller.create);

    /**
     * @swagger
     * /api/goods-brand/public/delete/{id}:
     *   delete:
     *     summary: 删除指定品牌
     *     description: 删除指定品牌
     *     tags:
     *      - 商品品牌
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
     * /api/goods-brand/public/update:
     *   put:
     *     summary: 更新指定品牌
     *     description: 更新指定品牌
     *     tags:
     *      - 商品品牌
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
     *               brand_name:
     *                 type: string
     *                 description: 品牌名称
     *                 example: 某品牌
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
     * /api/goods-brand/public/findAll:
     *   post:
     *     summary: 根据筛选条件查询品牌
     *     description: 根据筛选条件查询品牌
     *     tags:
     *      - 商品品牌
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
     *               brand_name:
     *                 type: string
     *                 description: 品牌名称
     *                 example: 某品牌
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
