const kit = require('./../kit');

/** 路由器标识 */
const ROUTER_Flag = "COMMON-FN";

/**
 * 删除 - 购物车
 */
exports.deletShoppingCartFn = async (req) => {
    const { uname } = req.headers || {};
    const { pids } = req.body || {};
    if(!uname){
        return {
            status: 400,
            sendContent: {
                code: `DM-${ ROUTER_Flag }-000002`,
                msg: '请求头uname不能为空!',
            },
        };
    }

    if(!pids) {
        return {
            status: 400,
            sendContent: {
                code: `DM-${ ROUTER_Flag }-000003`,
                msg: 'pids不能为空!',
            },
        };
    }

    if(!Array.isArray(pids)) {
        return {
            status: 400,
            sendContent: {
                code: `DM-${ ROUTER_Flag }-000004`,
                msg: 'pids值类型不对, 应为数组!',
            },
        };
    }

    if(!pids.length) {
        return {
            status: 400,
            sendContent: {
                code: `DM-${ ROUTER_Flag }-000005`,
                msg: 'pids不能为空!',
            },
        };
    }

    const result = await new Promise((resolve, reject) => {
        req?.pool?.query?.(
            "DELETE FROM dm_shopping_cart WHERE pid IN(?) AND uname=?", 
            [pids, uname],
            (err, data) => !err ? resolve(data) : reject(err),
        )
    });

    if(!result?.affectedRows) {
        return {
            status: 404,
            sendContent: {
                code: `DM-${ ROUTER_Flag }-000006`,
                msg: "删除购物车失败!",
            },
        };
    }
    
    return {
        status: 200,
        sendContent: {
            code: "DM-000000",
            msg: "删除购物车成功!",
        },
    };
};

/**
 * 取消加入收藏
 */
exports.deletGoodsCollectionFn = async (req, _pids) => {
    const { uname } = req.headers || {};
    let { pids } = req.body || {};
    pids = _pids || pids;
    if(!uname){
        return {
            status: 400,
            sendContent: {
                code: `DM-${ ROUTER_Flag }-000007`,
                msg: '请求头uname不能为空!',
            },
        };
    }

    if(!pids) {
        return {
            status: 400,
            sendContent: {
                code: `DM-${ ROUTER_Flag }-000008`,
                msg: 'pids不能为空!',
            },
        };
    }

    if(!Array.isArray(pids)) {
        return {
            status: 400,
            sendContent: {
                code: `DM-${ ROUTER_Flag }-000009`,
                msg: 'pids值类型不对, 应为数组!',
            },
        };
    }

    if(!pids.length) {
        return {
            status: 400,
            sendContent: {
                code: `DM-${ ROUTER_Flag }-000010`,
                msg: 'pids不能为空!',
            },
        };
    }

    const result = await new Promise((resolve, reject) => {
        req?.pool?.query?.(
            "DELETE FROM dm_goods_collection WHERE pid IN(?) AND uname=?", 
            [pids, uname],
            (err, data) => !err ? resolve(data) : reject(err),
        )
    });

    if(!result?.affectedRows) {
        return {
            status: 404,
            sendContent: {
                code: `DM-${ ROUTER_Flag }-000006`,
                msg: "取消加入收藏失败!",
            },
        };
    }
    
    return {
        status: 200,
        sendContent: {
            code: "DM-000000",
            msg: "取消加入收藏成功!",
        },
    };
};

/**
 * 查询 - 订单详情
 */
exports.selectOrderDetailsFn = async (req) => {
    const { order_no } = req.params || {};
    if(!order_no){
        return {
            status: 400,
            sendContent: {
                code: `DM-${ ROUTER_Flag }-0000011`,
                msg: 'order_no不能为空!',
            },
        };
    }

    const result01 = await new Promise((resolve, reject) => {
        req?.pool?.query?.(
            "SELECT * FROM dm_order WHERE order_no=?", 
            [order_no], 
            (err, reuslt) => !err ? resolve(reuslt?.[0] || {}) : reject(err),
        )
    });
    if(!result01 || !Object.keys(result01).length) {
        return {
            status: 404,
            sendContent: {
                code: `DM-${ ROUTER_Flag }-000012`,
                msg: '当前订单不存在!',
            },
        };
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
    return {
        status: 200,
        sendContent: {
            code: "DM-000000",
            content: {
                orderInfos: result01,
                addressInfos: result02,
                goodsInfos: result03,
            },
        },
    };
};