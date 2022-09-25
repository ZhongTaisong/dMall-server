const express=require("express");
const kit = require('./../kit');
const router=express.Router();
/**
 * 商品收藏
 */
/** 路由器标识 */
const ROUTER_Flag = "GOODS-COLLECTION";

/**
 * 查询
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

        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT * FROM dm_goods_collection WHERE uname=?", 
                [uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });


        const promise_list = [];
        if(Array.isArray(result)) {
            result.forEach(item => {
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
            content: result,
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000001`,
            msg: '操作失败!',
            error,
        });
    }
});

/**
 * 加入收藏
 */
router.post('/add', async (req, res) => {
    try {
        const { uname } = req.headers || {};
        const { pids } = req.body || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000004`,
                msg: '请求头uname不能为空!',
            });
        }

        if(!pids) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000005`,
                msg: 'pids不能为空!',
            });
        }

        if(!Array.isArray(pids)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000006`,
                msg: 'pids值类型不对, 应为数组!',
            });
        }

        if(!pids.length) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000007`,
                msg: 'pids不能为空!',
            });
        }

        let sql = "INSERT INTO dm_goods_collection VALUES ";
        const params = [];
        pids.forEach((item, index) => {
            sql += `(NULL, ?, ?)${index+1 < pids.length ? "," : ""}`;
            params.push(item, uname);
        });

        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                sql,
                params,
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000008`,
                msg: "加入收藏失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "加入收藏成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000003`,
            msg: '操作失败!',
            error,
        });
    }
});

/**
 * 根据pid查询是否被“加入收藏”
 */
router.post('/select/pids', async (req, res) => {
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

        const content = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT pid FROM dm_goods_collection WHERE pid IN(?) AND uname=?",
                [pids, uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });
        
        res.status(200).send({
            code: "DM-000000",
            content: content?.map?.(item => item?.pid) || [],
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
 * 取消加入收藏
 */
router.put('/delete', async (req, res) => {
    try {
        const { uname } = req.headers || {};
        const { pids } = req.body || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000015`,
                msg: '请求头uname不能为空!',
            });
        }

        if(!pids) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000016`,
                msg: 'pids不能为空!',
            });
        }

        if(!Array.isArray(pids)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000017`,
                msg: 'pids值类型不对, 应为数组!',
            });
        }

        if(!pids.length) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000018`,
                msg: 'pids不能为空!',
            });
        }

        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "DELETE FROM dm_goods_collection WHERE pid IN(?) AND uname=?", 
                [pids, uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000019`,
                msg: "取消加入收藏失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "取消加入收藏成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000014`,
            msg: '操作失败!',
            error,
        });
    }
});

module.exports=router;