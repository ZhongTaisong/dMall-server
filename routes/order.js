const express = require("express");
const router = express.Router();
const kit = require('./../kit');
const config = require('./../config');
const lodash = require('lodash');
// 路由器标识
const ROUTER_Flag = "HOME";

/**
 * 分页查询 - 当前用户订单
 */
router.post('/select', async (req, res) => {
    try {
        const { 
            current = 0, 
            pageSize = config?.PAGE_SIZE,
        } = req.body || {};
        const { uname } = req.headers || {};
    
        if(!uname) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000001`,
                msg: '请求头uname不能为空!',
            });
        }
    
        if(typeof current !== 'number'){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000002`,
                msg: 'current是Number类型!',
            });
        }
    
        if(current < 0) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000003`,
                msg: 'current大于等于0!',
            });
        }
    
        if(typeof pageSize !== 'number'){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000004`,
                msg: 'pageSize是Number类型!',
            });
        }
    
        if(pageSize < 1) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000005`,
                msg: 'pageSize大于等于1!',
            });
        }

        const [total, order_list] = await kit.promiseAllSettled([
            new Promise((resolve, reject) => {
                req?.pool?.query?.(
                    `SELECT COUNT(*) as total FROM dm_order WHERE uname=?`,
                    [ uname ], 
                    (err, reuslt) => !err ? resolve(reuslt?.[0]?.total || 0) : reject(err),
                );
            }),
            new Promise((resolve, reject) => {
                req?.pool?.query?.(
                    `SELECT * FROM dm_order WHERE uname=? ORDER BY submitTime DESC LIMIT ${ current }, ${ pageSize }`,
                    [ uname ], 
                    (err, reuslt) => !err ? resolve(reuslt) : reject(err),
                );
            }),
        ]);
    
        const promise_list = [];
        order_list.forEach(item => {
            promise_list.push(
                new Promise((resolve, reject) => {
                    req?.pool?.query?.(
                        `SELECT id, mainPicture, description, spec, price FROM dm_products WHERE id IN (${ item?.pid })`, 
                        null, 
                        (err, reuslt) => !err ? resolve(reuslt) : reject(err),
                    )
                })
            );
        });
    
        let goods_infos_all = await kit.promiseAllSettled(promise_list);
        goods_infos_all = lodash.uniqBy(goods_infos_all.flat(), "id");
    
        order_list.forEach(item => {
            const pids = item?.pid?.split?.(",") || [];
            const nums = item?.nums?.split?.(",") || [];
            const temp_map = Array.isArray(pids) && Array.isArray(nums) && pids.reduce((prev, item, index) => {
                prev[item] = Number(nums[index]) || 0;
                return prev;
            }, {});
    
            if(Array.isArray(pids) && pids.length) {
                const arr = goods_infos_all.filter(item02 => pids?.includes?.(String(item02?.id)));
                arr.forEach(item03 => {
                    item03['buyCount'] = Number(temp_map[item03?.id]);
                    item03['ordernum'] = item?.ordernum;
                    item03['totalprice'] = item?.totalprice;
                })
                item['goods_infos'] = arr;
            }
        });
    
        res.send({
            code: "DM-000000",
            content: {
                dataSource: order_list,
                current,
                pageSize,
                total,
            },
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000006`,
            msg: '操作失败!',
            error,
        });
    }
});

/**
 * 订单 - 删除
 */
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params || {};
        if(!id){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000007`,
                msg: 'id不能为空!',
            });
        }

        const data = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `DELETE FROM dm_order WHERE id=? `, 
                [id], 
                (err, reuslt) => !err ? resolve(Boolean(reuslt?.affectedRows)) : reject(err),
            )
        });
    
        if(!data) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000008`,
                msg: '当前订单不存在!',
            });
        }
    
        res.status(200).send({
            code: "DM-000000",
            content: null,
            msg: '删除订单成功!',
        });
        
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000009`,
            msg: '操作失败!',
            error,
        });
    }
});

/**
 * 订单详情
 */
router.get('/select/:ordernum', async (req, res) => {
    try {
        const { ordernum } = req.params || {};
        if(!ordernum){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-0000010`,
                msg: 'ordernum不能为空!',
            });
        }

        const result01 = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `SELECT ordernum, aid, pid, submitTime, num, totalprice, nums FROM dm_order WHERE ordernum=?`, 
                [ordernum], 
                (err, reuslt) => !err ? resolve(reuslt?.[0] || {}) : reject(err),
            )
        });
        if(!result01 || !Object.keys(result01).length) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000011`,
                msg: '当前订单不存在!',
            });
        };

        const { pid, nums, } = result01;
        const numMap = {};
        if(pid && nums) {
            const pids = pid?.split?.(",") || [];
            const nums_new = nums?.split?.(",") || [];
            if(Array.isArray(pids)) {
                pids.forEach((item, index) => {
                    numMap[item] = nums_new?.[index] || 1;
                })
            }
        }

        const [result02, result03] = await kit.promiseAllSettled([
            new Promise((resolve, reject) => {
                req?.pool?.query?.(
                    `SELECT * FROM dm_address WHERE id=?`, 
                    [result01?.aid], 
                    (err, reuslt) => !err ? resolve(reuslt?.[0] || {}) : reject(err),
                )
            }),
            new Promise((resolve, reject) => {
                req?.pool?.query?.(
                    `SELECT mainPicture, description, spec, price, id FROM dm_products WHERE id IN (${ result01?.pid })`, 
                    null, 
                    (err, reuslt) => !err ? resolve(reuslt) : reject(err),
                )
            }),
        ]);

        if(Array.isArray(result03)) {
            result03.forEach(item => {
                item['buyCount'] = Number(numMap[item?.id] || 1);
            })
        }
        delete result01['nums'];
        delete result01['pid'];
        delete result01['aid'];

        res.status(200).send({
            code: "DM-000000",
            content: {
                orderInfos: result01,
                addressInfos: result02,
                goodsInfos: result03,
            },
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000012`,
            msg: '操作失败!',
            error,
        });
    }
});

module.exports = router;