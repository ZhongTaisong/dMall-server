const express = require('express');
const router = express.Router();
const moment = require('moment');
const lodash  = require('lodash');
const kit = require('./../kit');
const axios = require('./../axios');
// 路由器标识
const ROUTER_Flag = "GOODS_EVALUATE";

/**
 * 根据商品id查询评价
 */
router.get('/public/select/:pid', async (req, res) => {
    try {
        const { pid } = req.params || {};
        if(!pid){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000001`,
                msg: 'pid不能为空!',
            });
        }
    
        const result01 = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT * FROM dm_comment WHERE pid=?", 
                [pid],
                (err, reuslt) => !err ? resolve(reuslt) : reject(err),
            )
        });
    
        const promise_list = [];
        if(Array.isArray(result01)) {
            const unames = lodash.uniq(result01.map(item => item.uname));
            if(Array.isArray(unames)) {
                unames.forEach(item => {
                    promise_list.push(
                        new Promise((resolve, reject) => {
                            req?.pool?.query?.(
                                "SELECT uname, avatar FROM dm_user WHERE uname=?",
                                [item], 
                                (err, reuslt) => !err ? resolve(reuslt?.[0] || null) : reject(err),
                            )
                        })
                    );
                });
            }
    
            const result02 = await kit.promiseAllSettled(promise_list);
            result01.forEach(item => {
                const obj = result02.find(item02 => item02.uname === item.uname) || {};
                if(obj && Object.keys(obj).length) {
                    item['avatar'] = obj.avatar || null;
                }
            })
        };
    
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

/**
 * 添加评价
 */
router.post('/add', async (req, res) => {
    try {
        const { uname } = req.headers || {};
        let { pid, order_no, content, } = req.body || {};
        const maxLength = 300;
        content = content?.trim?.();
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000004`,
                msg: '请求头uname不能为空!',
            });
        }

        if(!pid){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000005`,
                msg: 'pid不能为空!',
            });
        }

        if(!order_no){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000012`,
                msg: 'order_no不能为空!',
            });
        }

        if(!content){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000006`,
                msg: 'content不能为空!',
            });
        }

        if(content.length > maxLength){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000007`,
                msg: `评价内容不能超过${ maxLength }个字!`,
            });
        }
    
        const date = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "INSERT INTO dm_comment VALUES (NULL, ?, ?, ?, ?, ?, ?, ?)", 
                [uname, pid, content, date, 0, 0, order_no],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        res.status(200).send({
            code: "DM-000000",
            content: null,
            msg: '评价成功!'
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

/**
 * 修改评价
 */
router.put('/update', async (req, res) => {
    try {
        const { id, content, } = req.body || {};
        const maxLength = 300;
        if(!id){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000009`,
                msg: 'id不能为空!',
            });
        }

        if(!content){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000010`,
                msg: 'content不能为空!',
            });
        }

        if(content.length > maxLength){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000011`,
                msg: `评价内容不能超过${ maxLength }个字!`,
            });
        }
    
        const date = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "UPDATE dm_comment SET content=?, commentTime=? WHERE id=?", 
                [content, date, id],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });
    
        res.status(200).send({
            code: "DM-000000",
            content: null,
            msg: '评价成功!'
        }); 
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000008`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 根据订单编号 - 查询商品详情、商品评价
 */
router.get('/select/:order_no', async (req, res) => {
    try {
        const { order_no } = req.params || {};
        if(!order_no){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-0000014`,
                msg: 'order_no不能为空!',
            });
        }
        const result = await axios.use.get(`/order/select/${order_no}`);

        let { goodsInfos, } = result?.data?.content || {};
        const promise_list = [];
        if(Array.isArray(goodsInfos)) {
            goodsInfos.forEach(item => {
                promise_list.push(
                    new Promise((resolve, reject) => {
                        req?.pool?.query?.(
                            "SELECT * FROM dm_comment WHERE pid=?",
                            [item.id], 
                            (err, reuslt) => !err ? resolve(reuslt?.[0] || {}) : reject(err),
                        )
                    })
                );
            });
    
            const result02 = await kit.promiseAllSettled(promise_list);
            goodsInfos.forEach(item => {
                const data = result02?.find?.(item02 => item.id === item02.pid);
                item['order_no'] = order_no;
                item['pid'] = item?.id;
                if(data) {
                    item['content'] = data?.content || null;
                    item['id'] = data?.id || null;
                }
            })
        }
        res.status(200).send({
            code: "DM-000000",
            content: goodsInfos,
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