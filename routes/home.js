const express = require('express');
const router = express.Router();
// 路由器标识
const ROUTER_Flag = "HOME";

/**
 * 查询 - 热门推荐商品
 */
router.get('/public/hot-recommendations', async (req, res) => {
    try {
        const content = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT id, mainPicture, price, productName, description FROM dm_products WHERE hot=?", 
                [101], 
                (err, reuslt) => !err ? resolve(reuslt) : reject(err),
            );
        });
        
        res.status(200).send({
            code: "DM-000000",
            content,
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000001`,
            msg: '操作失败!',
            error,
        });
    }
});

/**
 * 查询 - 单品推广商品
 */
router.get('/public/single-product-promotion', async (req, res) => {
    try {
        const content = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT id, mainPicture, price, productName, description FROM dm_products WHERE single=?", 
                [102], 
                (err, reuslt) => !err ? resolve(reuslt) : reject(err),
            );
        });
        
        res.status(200).send({
            code: "DM-000000",
            content,
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000002`,
            msg: '操作失败!',
            error,
        });
    }
});

/**
 * 查询 - 大图推广商品
 */
router.get('/public/large-scale-promotion', async (req, res) => {
    try {
        const content = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT id, bannerPic, description FROM dm_products WHERE banner=?", 
                [103], 
                (err, reuslt) => !err ? resolve(reuslt) : reject(err),
            );
        });

        res.status(200).send({
            code: "DM-000000",
            content,
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000003`,
            msg: '操作失败!',
            error,
        });
    }
});

module.exports = router;