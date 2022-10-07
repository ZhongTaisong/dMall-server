const express = require('express');
const moment = require('moment');
const router = express.Router();
const config = require('./../../config');
/**
 * 管理后台 - 品牌管理
 */
// 路由器标识
const ROUTER_Flag = "BRAND_MANAGEMENT";

/**
 * 分页查询 - 品牌列表
 */
router.post('/select', async (req, res) => {
    try {
        const { 
            current = 0, 
            pageSize = config?.PAGE_SIZE,
        } = req.body || {};
        if(typeof current !== 'number'){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000001`,
                msg: 'current是Number类型!',
            });
        }
    
        if(current < 0) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000002`,
                msg: 'current大于等于0!',
            });
        }
    
        if(typeof pageSize !== 'number'){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000003`,
                msg: 'pageSize是Number类型!',
            });
        }
    
        if(pageSize < 1) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000004`,
                msg: 'pageSize大于等于1!',
            });
        }
    
        const [dataSource, total] = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `
                SELECT SQL_CALC_FOUND_ROWS * FROM dm_brands ORDER BY update_time DESC LIMIT ?, ?;
                SELECT FOUND_ROWS() as total;
                `,
                [current * pageSize, pageSize], 
                (err, reuslt) => !err ? resolve([reuslt?.[0] || [], reuslt?.[1]?.[0]?.total || 0]) : reject(err),
            );
        });
    
        res.status(200).send({
            code: "DM-000000",
            content: {
                dataSource,
                current,
                pageSize,
                total,
            },
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000005`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 添加品牌
 */
router.post('/add', async (req, res) => {
    try {
        let { brand_name } = req.body || {};
        brand_name = brand_name?.trim?.();
        if( !brand_name ){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000007`,
                msg: 'brand_name不能为空!',
            });
        }
        
        // 操作时间
        const time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "INSERT INTO dm_brands (brand_name, create_time, update_time) VALUES (?, ?, ?)",
                [brand_name, time, time],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000008`,
                msg: "添加品牌失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "添加品牌成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000006`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 更新品牌
 */
router.put('/update', async (req, res) => {
    try {
        let { brand_id, brand_name } = req.body || {};
        brand_name = brand_name?.trim?.();
        if(!brand_id){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000010`,
                msg: 'brand_id不能为空!',
            });
        }

        if(!brand_name){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000011`,
                msg: 'brand_name不能为空!',
            });
        }
        
        // 操作时间
        const time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "UPDATE dm_brands SET brand_name=?, update_time=? WHERE brand_id=?",
                [brand_name, time, brand_id],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000012`,
                msg: "更新品牌失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "更新品牌成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000009`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 删除品牌
 */
router.delete('/delete/:brand_id', async (req, res) => {
    try {
        const { brand_id } = req.params || {};
        if(!brand_id){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000014`,
                msg: 'brand_id不能为空!',
            });
        }
        
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "DELETE FROM dm_brands WHERE brand_id=?",
                [brand_id],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000015`,
                msg: "删除品牌失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "删除品牌成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000013`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

module.exports = router;