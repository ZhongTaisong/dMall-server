const express = require('express');
const router = express.Router();
const config = require('./../config');
/**
 * 商品详情
 */
// 路由器标识
const ROUTER_Flag = "GOODS_DETAIL";

/**
 * 查询 - 商品详情
 */
router.get("/public/select/:id", async (req, res) => {
    try {
        const { id } = req?.params || {};
        if(!id){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000001`,
                msg: 'id不能为空!',
            });
        }

        const result01 = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `SELECT * FROM dm_goods WHERE id=${ id }`, 
                null,
                (err, reuslt) => !err ? resolve(reuslt?.[0] || {}) : reject(err),
            )
        });

        const result02 = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `SELECT id, spec FROM dm_goods WHERE brand_id=${ result01?.brand_id }`, 
                null,
                (err, reuslt) => !err ? resolve(reuslt) : reject(err),
            )
        });
        
        let images = [];
        let detailImgs = [];
        if(result01 && Object.keys(result01).length) {
            const { main_picture, goods_picture, detail_picture } = result01;

            images = goods_picture?.split?.("|") || [];
            delete result01['goods_picture'];
            detailImgs = detail_picture?.split?.("|") || [];
            delete result01['detail_picture'];
            if(main_picture) {
                images.unshift(main_picture);
                delete result01['main_picture'];
            }
        }

        if(Array.isArray(images)) {
            images = images.map(item => {
                return item ? `${ config.REQUEST_URL }${ config.GOODS_MAIN_PATH }/${ item }` : null;
            })
        }

        if(Array.isArray(detailImgs)) {
            detailImgs = detailImgs.map(item => {
                return item ? `${ config.REQUEST_URL }${ config.GOODS_DETAIL_PATH }/${ item }` : null;
            })
        }

        result01['images'] = images;
        result01['detailImgs'] = detailImgs;
        result01['specs'] = result02;
        delete result01['spec'];

        res.status(200).send({
            code: "DM-000000",
            content: result01,
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000002`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

module.exports = router;