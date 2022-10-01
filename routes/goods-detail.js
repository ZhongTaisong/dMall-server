const express = require('express');
const router = express.Router();
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
                `SELECT * FROM dm_products WHERE id=${ id }`, 
                null,
                (err, reuslt) => !err ? resolve(reuslt?.[0] || {}) : reject(err),
            )
        });

        const result02 = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `SELECT id, spec FROM dm_products WHERE brandId=${ result01?.brandId }`, 
                null,
                (err, reuslt) => !err ? resolve(reuslt) : reject(err),
            )
        });
        
        let images = [];
        let detailImgs = [];
        if(result01 && Object.keys(result01).length) {
            const { mainPicture, pictures, detailsPic } = result01;

            images = pictures?.split?.("|") || [];
            delete result01['pictures'];
            detailImgs = detailsPic?.split?.("|") || [];
            delete result01['detailsPic'];
            if(mainPicture) {
                images.unshift(mainPicture);
                delete result01['mainPicture'];
            }


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