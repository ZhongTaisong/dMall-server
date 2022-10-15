const express = require("express");
const moment = require('moment');
const router = express.Router();
const kit = require('./../../kit');
const config = require('./../../config');
const lodash = require('lodash');
/**
 * 管理后台 - 订单管理
 */
// 路由器标识
const ROUTER_Flag = "ORDER_MANAGEMENT";

/**
 * 分页查询 - 订单列表
 */
router.post('/select', async (req, res) => {
    try {
        const { 
            current = 0, 
            pageSize = config?.PAGE_SIZE,
        } = req.body || {};
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
                    "SELECT COUNT(*) as total FROM dm_order",
                    null, 
                    (err, reuslt) => !err ? resolve(reuslt?.[0]?.total || 0) : reject(err),
                );
            }),
            new Promise((resolve, reject) => {
                req?.pool?.query?.(
                    "SELECT * FROM dm_order ORDER BY create_time DESC LIMIT ?, ?",
                    [current * pageSize, pageSize], 
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
                        "SELECT id, main_picture, description, spec, price FROM dm_goods WHERE id IN (?)", 
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
                item['num'] = order_infos.reduce((total, _item) => {
                    return total += _item?.num;
                }, 0);
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
            code: `DM-${ ROUTER_Flag }-000001`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

module.exports = router;