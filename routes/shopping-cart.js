const express=require("express");
const moment = require('moment');
const axios = require('./../axios');
const kit = require('./../kit');
const config = require('./../config');
const router = express.Router();
/**
 * 购物车
 */
/** 路由器标识 */
const ROUTER_Flag = "SHOPPING-CART";

/**
 * 查询 - 购物车
 */
router.get('/select', async (req, res) => {
    try {
        const { uname } = req.headers || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000002`,
                msg: '请求头uname不能为空!',
            });
        }

        let totalNum = 0;
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT * FROM dm_shopping_cart WHERE uname=? ORDER BY update_time DESC", 
                [uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        const promise_list = [];
        if(Array.isArray(result)) {
            result.forEach(item => {
                totalNum += Number(item?.num);
                promise_list.push(
                    new Promise((resolve, reject) => {
                        req?.pool?.query?.(
                            "SELECT * FROM dm_products WHERE id=?",
                            [item?.pid], 
                            (err, data) => !err ? resolve(data?.[0] || {}) : reject(err),
                        )
                    })
                );
            });
        }
        const goods_list = await kit.promiseAllSettled(promise_list);

        if(Array.isArray(result) && Array.isArray(goods_list)) {
            result.forEach(item => {
                item['goodsInfo'] = goods_list.find(item02 => item?.pid === item02?.id) || {};
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            content: {
                dataSource: result,
                totalNum,
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

/**
 * 加入购物车
 */
router.post('/add/:action?', async (req, res) => {
    try {
        const { uname, } = req.headers;
        const { goodsInfo } = req.body || {};
        const { action, } = req.params || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000004`,
                msg: '请求头uname不能为空!',
            });
        }

        if(!goodsInfo) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000005`,
                msg: 'goodsInfo不能为空!',
            });
        }

        if(!Array.isArray(goodsInfo)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000006`,
                msg: 'goodsInfo值类型不对, 应为数组!',
            });
        }

        if(!goodsInfo.length) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000007`,
                msg: 'goodsInfo不能为空!',
            });
        }

        /** 获取商品单价 */
        const goodsList = await kit.promiseAllSettled(
            goodsInfo.reduce((list, item) => {
                list.push(
                    new Promise((resolve, reject) => {
                        req?.pool?.query?.(
                            "SELECT id, price FROM dm_products WHERE id=?",
                            [item?.pid], 
                            (err, data) => !err ? resolve(data?.[0] || {}) : reject(err),
                        )
                    })
                );
                return list;
            }, [])
        );

        /** 查询当前用户的购物车 */
        const cartList = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT * FROM dm_shopping_cart WHERE uname=?",
                [uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        /** 入库 */
        await kit.promiseAllSettled(
            goodsInfo.reduce((list, item, index) => {
                // 从购物车中筛选出已加购商品
                const cartListItem = cartList?.find?.(item02 => item02?.pid === item?.pid);
                // 获取商品单价
                const price = goodsList?.[index]?.price ?? 0;
                // 加购商品数量
                const num = ((item?.num ?? 0) + (cartListItem?.num ?? 0)) ?? 1;
                // 加购商品总价
                const totalprice = num * price;
                // 操作时间
                const time = moment(Date.now() + index).format('YYYY-MM-DD HH:mm:ss');
    
                if(cartListItem) {
                    list.push(
                        new Promise((resolve, reject) => {
                            req?.pool?.query?.(
                                "UPDATE dm_shopping_cart SET num=?, totalprice=?, update_time=? WHERE pid=? AND uname=?",
                                [num, totalprice, time, item?.pid, uname], 
                                (err, data) => !err ? resolve(Boolean(data?.affectedRows)) : reject(err),
                            )
                        })
                    );
                }else {
                    list.push(
                        new Promise((resolve, reject) => {
                            req?.pool?.query?.(
                                "INSERT INTO dm_shopping_cart (uname, pid, num, totalprice, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?)",
                                [uname, item?.pid, num, totalprice, time, time],
                                (err, data) => !err ? resolve(Boolean(data?.affectedRows)) : reject(err),
                            )
                        })
                    );
                }

                return list;
            }, [])
        );

        if(['goods-collection'].includes(action)) {
            const pids = goodsInfo.map(item => item?.pid) || [];
            const result03 = await axios.use.put("/goods-collection/delete", { pids, });
            if(result03?.data?.code !== config?.SUCCESS_CODE) {
                return res.status(404).send({
                    code: `DM-${ ROUTER_Flag }-000022`,
                    msg: "加入购物车失败!",
                });
            }
        }

        res.status(200).send({
            code: "DM-000000",
            msg: "加入购物车成功!",
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
 * 删除 - 购物车
 */
router.put('/delete', async (req, res) => {
    try {
        const { uname } = req.headers || {};
        const { pids } = req.body || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000010`,
                msg: '请求头uname不能为空!',
            });
        }

        if(!pids) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000011`,
                msg: 'pids不能为空!',
            });
        }

        if(!Array.isArray(pids)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000012`,
                msg: 'pids值类型不对, 应为数组!',
            });
        }

        if(!pids.length) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000013`,
                msg: 'pids不能为空!',
            });
        }

        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "DELETE FROM dm_shopping_cart WHERE pid IN(?) AND uname=?", 
                [pids, uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000014`,
                msg: "删除购物车失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "删除购物车成功!",
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
 * 查询 - 已加购商品数量
 */
router.get('/select/num', async (req, res) => {
    try {
        const { uname } = req.headers || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000016`,
                msg: '请求头uname不能为空!',
            });
        }

        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT num FROM dm_shopping_cart WHERE uname=?", 
                [uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        const content = result?.reduce?.((total, item) => {
            const num = !Number.isNaN(item?.num) ? Number(item?.num) : 1;
            return total += num;
        }, 0) ?? 0;

        res.status(200).send({
            code: "DM-000000",
            content,
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000015`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 更新 - 已加购商品数量
 */
router.patch('/update/num', async (req,res) => {
    try {
        const { uname } = req.headers || {};
        const { pid, num, } = req.body || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000018`,
                msg: '请求头uname不能为空!',
            });
        }

        if(!pid){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000019`,
                msg: 'pid不能为空!',
            });
        }

        if(!num){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000020`,
                msg: 'num不能为空!',
            });
        }

        const price = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT price FROM dm_products WHERE id=?", 
                [pid],
                (err, data) => !err ? resolve(data?.[0]?.price ?? 0) : reject(err),
            )
        });

        const totalprice = num * price;
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "UPDATE dm_shopping_cart SET num=?, totalprice=? WHERE pid=? AND uname=?", 
                [num, totalprice, pid, uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000021`,
                msg: "更新失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "更新成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000017`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

// webApp - 查当前商品下所有规格
router.get('/select/spec', (req, res) => {
    const { pid } = req.query || {};
    if( !pid ){
        res.status(400).send({
            code: 1,
            msg: 'pid不能为空！'
        })
        return;
    }

    let sql = 'SELECT id, spec, price FROM dm_products WHERE brandId=(SELECT brandId FROM dm_products WHERE id=?)';
    req?.pool?.query?.(sql, [pid], (err, data) => {
        if( err ){
            res.status(503).send({
                code: 2,
                msg: err
            })
        }else{
            res.send({
                code: "DM-000000",
                data,
                
            })
        }
    })

})

// webApp - 更改规格
router.post('/update/spec', (req, res) => {
    const { id, pid, num, price } = req.body || {};
    if( !id ){
        res.status(400).send({
            code: 1,
            msg: 'id不能为空！'
        })
        return;
    }
    if( !pid ){
        res.status(400).send({
            code: 2,
            msg: 'pid不能为空！'
        })
        return;
    }
    if( !num ){
        res.status(400).send({
            code: 3,
            msg: 'num不能为空！'
        })
        return;
    }
    if( !price ){
        res.status(400).send({
            code: 4,
            msg: 'price不能为空！'
        })
        return;
    }
    const totalprice = Number(price) * Number(num);
    let sql = 'UPDATE dm_shopping_cart SET pid=?, totalprice=? WHERE id=?';
    req?.pool?.query?.(sql, [pid, totalprice, id], (err, data) => {
        if( err ){
            res.status(503).send({
                code: 5,
                msg: err
            })
        }else{
            if( data.affectedRows ){
                res.send({
                    code: "DM-000000",
                    data: null
                })
            }else{
                res.send({
                    code: 6,
                    msg: '更改规格失败'
                })
            }
        }
    })
})

// webApp - 当前用户默认收货地址
router.get('/select/address', (req, res) => {
    const { uname } = req.headers || {};
    if( !uname ){
        res.status(400).send({
            code: 1,
            msg: 'uname不能为空！'
        })
        return;
    }
    
    let sql = "SELECT region, detail FROM dm_address WHERE uname=? AND isDefault=1";
    req?.pool?.query?.(sql, [uname], (err, data) => {
        if(err) throw err;
        res.send({
            code: "DM-000000",
            data: data[0] || {}            
        })
    });

})

module.exports = router;