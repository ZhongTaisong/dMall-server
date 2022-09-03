const express = require('express');
const router = express.Router();
const kit = require('./../kit');    
const config = require('./../config');
const lodash = require('lodash');

// 路由器标识
const ROUTER_Flag = "GOODS_LIST";

/**
 * 分页查询 - 商品列表
 */
router.post('/public/select', async (req, res) => {
    try {
        const { 
            current = 0, 
            pageSize = config?.PAGE_SIZE,
            keyword = '',
            filterParams = {},
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
    
        let sql = "";
        if(filterParams && Object.keys(filterParams).length) {
            Object.entries(filterParams).forEach(([key, value]) => {
                if(key === 'price') {
                    const arr = value?.split?.("-")?.filter?.(item => item);
                    if(Array.isArray(arr)) {
                        if(arr.length >= 2) {
                            sql += `AND ${key}>="${parseFloat(arr?.[0]) || 0}" AND ${key}<="${parseFloat(arr?.[1]) || 0}"`;
                        }else if(arr.length === 1) {
                            sql += `AND ${key}>="${parseFloat(arr?.[0]) || 0}"`;
                        }
                    }
                }else {
                    sql += `AND ${key}="${value}"`;
                }
            });
        }
    
        const [dataSource, total] = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `
                SELECT SQL_CALC_FOUND_ROWS * FROM dm_products WHERE 
                ${ keyword ? `description LIKE "%${ keyword }%" AND` : '' } 
                onLine=100 ${ sql } LIMIT ${ current }, ${ pageSize };
                SELECT FOUND_ROWS() as total;
                `,
                null, 
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
        });
    }
});

/**
 * 查询 - 商品筛选条件
 */
router.get('/public/select/filter', async (req, res) => {
    try {
        const promise_list = [];
        ['brandId', 'screenSize', 'cpu', 'memory', 'disk', 'thickness', 'systems'].forEach(item => {
            promise_list.push(
                new Promise((resolve, reject) => {
                    req?.pool?.query?.(
                        `SELECT ${ item } FROM dm_products`,
                        null, 
                        (err, reuslt) => !err ? resolve({ [item]: reuslt }) : reject(err),
                    )
                })
            );
        });
    
        const reuslt = await kit.promiseAllSettled(promise_list);
        if(!Array.isArray(reuslt)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000006`,
                msg: '操作失败!',
            });
        }
    
        const brand_list = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `SELECT * FROM dm_brands `,
                null, 
                (err, reuslt) => !err ? resolve(reuslt) : reject(err),
            )
        })
    
        const content = {};
        reuslt.forEach(item => {
            Object.entries(item).forEach(([key, value]) => {
                let arr = lodash.uniqBy(value, key).map(item02 => item02[key]);
                if(['brandId'].includes(key)) {
                    key = 'brands';
                    if(Array.isArray(brand_list)) {
                        arr = brand_list.filter(item03 => arr.includes(String(item03?.id)));
                    }
                }
                content[key] = arr;
            });
        });
    
        res.status(200).send({
            code: "DM-000000",
            content,
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000007`,
            msg: '操作失败!',
            error,
        });
    }
});

module.exports = router;