const express = require("express");
const moment = require('moment');
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
                    `SELECT * FROM dm_order WHERE uname=? ORDER BY create_time DESC LIMIT ${ current }, ${ pageSize }`,
                    [ uname ], 
                    (err, reuslt) => !err ? resolve(reuslt) : reject(err),
                );
            }),
        ]);
    
        const promise_list = [];
        order_list.forEach(item => {
            const order_infos = JSON.parse(item?.order_infos || '[]');
            const pids = order_infos?.map?.(item02 => item02?.pid) || [];
            promise_list.push(
                new Promise((resolve, reject) => {
                    req?.pool?.query?.(
                        "SELECT id, mainPicture, description, spec, price FROM dm_products WHERE id IN (?)", 
                        [pids], 
                        (err, reuslt) => !err ? resolve(reuslt) : reject(err),
                    )
                })
            );
        });
    
        let goods_infos_all = await kit.promiseAllSettled(promise_list);
        goods_infos_all = lodash.uniqBy(goods_infos_all.flat(), "id");
    
        order_list.forEach(item => {
            const order_infos = JSON.parse(item?.order_infos || '[]');
            if(Array.isArray(order_infos) ) {
                const pids = order_infos.map(item02 => item02?.pid) || [];
                const arr = goods_infos_all.filter(item02 => pids?.includes?.(item02?.id));
                arr.forEach(item03 => {
                    item03['num'] = order_infos.find(item04 => item04?.pid === item03?.id)?.num ?? 1;
                    item03['order_no'] = item?.order_no;
                    item03['total_price'] = item?.total_price;
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
            errorMsg: error?.message,
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
            errorMsg: error?.message,
        });
    }
});

/**
 * 订单详情
 */
router.get('/select/:order_no', async (req, res) => {
    try {
        const { order_no } = req.params || {};
        if(!order_no){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-0000010`,
                msg: 'order_no不能为空!',
            });
        }

        const result01 = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT * FROM dm_order WHERE order_no=?", 
                [order_no], 
                (err, reuslt) => !err ? resolve(reuslt?.[0] || {}) : reject(err),
            )
        });
        if(!result01 || !Object.keys(result01).length) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000011`,
                msg: '当前订单不存在!',
            });
        };

        const order_infos = JSON.parse(result01?.order_infos || '[]');
        const pids = order_infos?.map?.(item => item?.pid) || [];
        const [result02, result03] = await kit.promiseAllSettled([
            new Promise((resolve, reject) => {
                req?.pool?.query?.(
                    "SELECT * FROM dm_address WHERE id=?", 
                    [result01?.address_id], 
                    (err, reuslt) => !err ? resolve(reuslt?.[0] || {}) : reject(err),
                )
            }),
            new Promise((resolve, reject) => {
                req?.pool?.query?.(
                    "SELECT mainPicture, description, spec, id FROM dm_products WHERE id IN (?)", 
                    [pids], 
                    (err, reuslt) => !err ? resolve(reuslt) : reject(err),
                )
            }),
        ]);

        if(Array.isArray(result03)) {
            result03.forEach(item => {
                const data = order_infos?.find?.(item02 => item02?.pid === item?.id);
                if(data) {
                    item['price'] = data?.price ?? 0;
                    item['num'] = data?.num ?? 1;
                }
            })
        }

        let total_num = 0;
        if(Array.isArray(order_infos)) {
            total_num = order_infos.reduce((total, item) => {
                return total += item?.num;
            }, 0);
        }

        result01['total_num'] = total_num;
        delete result01['order_infos'];
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
            errorMsg: error?.message,
        });
    }
});

/**
 * 生成订单
 */
router.post('/add', async (req, res) => {
    try {
        const { uname } = req.headers || {};
        const { addressId, orderInfos, } = req.body || {};
        if(!uname) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000014`,
                msg: '请求头uname不能为空!',
            });
        }

        if(!addressId) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000015`,
                msg: 'addressId不能为空!',
            });
        }

        if(!orderInfos) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000016`,
                msg: 'orderInfos不能为空!',
            });
        }

        if(!Array.isArray(orderInfos)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000017`,
                msg: 'orderInfos值类型不对, 应为数组!',
            });
        }

        if(!orderInfos.length) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000018`,
                msg: 'orderInfos不能为空!',
            });
        }

        const orderNo = moment(Date.now()).format('YYYYMMDDHHmmss');
        const createTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        const total_price = orderInfos.reduce((total, item) => {
            return total += item?.totalprice;
        }, 0);
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "INSERT INTO dm_order (uname, order_no, order_infos, address_id, create_time, total_price) VALUES (?, ?, ?, ?, ?, ?)", 
                [uname, orderNo, JSON.stringify(orderInfos), addressId, createTime, total_price],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000019`,
                msg: "生成订单失败!",
            });
        }

        const pids = orderInfos.map(item => item?.pid) || [];
        await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "DELETE FROM dm_shopping_cart WHERE pid IN (?)", 
                [pids],
                (err, data) => !err ? resolve(Boolean(data?.affectedRows)) : reject(err),
            )
        });
        
        res.status(200).send({
            code: "DM-000000",
            content: orderNo,
            msg: "生成订单成功!",
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