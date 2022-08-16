const express = require('express');
const router = express.Router();
const kit = require('./../kit');
// 路由器标识
const ROUTER_Flag = "GOODS_DETAIL";

/**
 * 查询 - 商品详情
 */
router.get("/select/:id", async (req, res) => {
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
            (err, reuslt) => !err ? resolve(reuslt) : reject(err),
        )
    });

    // const result02 = await new Promise((resolve, reject) => {
    //     req?.pool?.query?.(
    //         `SELECT id, spec FROM dm_products WHERE brandId=${ }`, 
    //         null,
    //         (err, reuslt) => !err ? resolve(reuslt) : reject(err),
    //     )
    // });

    res.send({
        code: "DM-000000",
        err: result01,
        content: result01,
    });

    // (async () => {
    //     let obj = {}
    //     // 查询当前商品id下的数据
    //     await new Promise((resolve, reject) => {
    //         let sql = '';
    //         req?.pool?.query?.(sql, [id], (err, data) => {
    //             if(err) throw err;
    //             if( data.length ){
    //                 const { id, brandId, mainPicture, pictures, productName, description, copywriting, price, spec, detailsPic, ...rest } = data[0] || {};
    //                 obj = {                        
    //                     imgList: [mainPicture, ...(pictures ? pictures.split('|') : [])],
    //                     basicInfo: { id, brandId, productName, description, copywriting, price, spec },
    //                     params: {id, brandId, productName, ...rest},
    //                     detailsPic: [ ...(detailsPic ? detailsPic.split('|') : []) ]
    //                 }
    //                 resolve();
    //             }else{
    //                 res.send({
    //                     code: 2,
    //                     msg: '当前商品数据不存在！'
    //                 })
    //             }
    //         })  
    //     })
    //     // 查询同一品牌的商品规格
    //     await new Promise((resolve, reject) => {
    //         const { basicInfo } = obj || {};
    //         let sql = '';
    //         req?.pool?.query?.(sql, [basicInfo.brandId], (err, data) => {
    //             if(err) throw err;
    //             if( data.length ){
    //                 obj = { ...obj,                        
    //                     specs: data
    //                 }
    //                 resolve();
    //             }else{
    //                 res.send({
    //                     code: 2,
    //                     msg: '当前商品规格不存在！'
    //                 })
    //             }
    //         })  
    //     })
    //     res.send({
    //         code: 200,
    //         data: obj,
            
    //     })
    // })()
})

module.exports=router;