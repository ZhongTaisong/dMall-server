const express = require('express');
const router = express.Router();
const config = require('./../config');
/**
 * 首页
 */
// 路由器标识
const ROUTER_Flag = "HOME";

/**
 * 查询 - 热门推荐商品
 */
router.get('/public/hot-recommendations', async (req, res) => {
    try {
        const content = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT id, main_picture, price, goods_name, description FROM dm_goods WHERE recommend_status=?", 
                [1], 
                (err, reuslt) => !err ? resolve(reuslt) : reject(err),
            );
        });

        if(Array.isArray(content)) {
            content.forEach(item => {
                const main_picture = item?.['main_picture'];
                if(main_picture) {
                    item['main_picture'] = `${ config.REQUEST_URL }${ config.GOODS_MAIN_PATH }/${ main_picture }`;
                }
            })
        }
        
        res.status(200).send({
            code: "DM-000000",
            content,
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000001`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 查询 - 大图banner推广商品
 */
router.get('/public/large-scale-promotion', async (req, res) => {
    try {
        const content = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT id, banner_picture, description FROM dm_goods WHERE banner_status=?", 
                [1], 
                (err, reuslt) => !err ? resolve(reuslt) : reject(err),
            );
        });

        if(Array.isArray(content)) {
            content.forEach(item => {
                const banner_picture = item?.['banner_picture'];
                if(banner_picture) {
                    item['banner_picture'] = `${ config.REQUEST_URL }${ config.BANNER_PATH }/${ banner_picture }`;
                }
            })
        }

        res.status(200).send({
            code: "DM-000000",
            content,
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000003`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

module.exports = router;