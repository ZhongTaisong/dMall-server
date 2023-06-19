const express = require('express');
const moment = require('moment');
const router = express.Router();
const config = require('./../../config');
const kit = require('./../../kit');
/**
 * 管理后台 - 权限管理
 */
// 路由器标识
const ROUTER_Flag = "PERMISSION_MANAGEMENT";

/**
 * 分页查询 - 权限列表
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
                SELECT SQL_CALC_FOUND_ROWS * FROM dm_permission ORDER BY update_time DESC LIMIT ?, ?;
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
 * 添加权限
 */
router.post('/add', async (req, res) => {
    try {
        const { uname, role, } = req.body || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000007`,
                msg: 'uname不能为空!',
            });
        }

        if(!role) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000008`,
                msg: 'role不能为空!',
            });
        }

        if(!["1", "2"].includes(role)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000009`,
                msg: 'role参数值异常!',
            });
        }

        const body = req.body;
        let sql_key = "";
        let sql_value = "";
        const params = [];
        const generate_time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        [
            "uname", "role", "brand_management", "goods_management", 
            "order_management", "user_management", "goods_evaluate_management", 
            "permission_management", "create_time", "update_time",
        ].forEach((item, index, arr) => {
            sql_key += `${ item }${ index < arr.length - 1 ? ", " : "" }`;
            sql_value += `?${ index < arr.length - 1 ? ", " : "" }`;
            if(["create_time", "update_time"].includes(item)) {
                params.push(generate_time);
            }else {
                params.push(body[item] || null);
            }
        })
        
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `INSERT INTO dm_permission (${ sql_key }) VALUES (${ sql_value })`,
                params,
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000010`,
                msg: "添加权限失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "添加权限成功!",
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
 * 更新权限
 */
router.put('/update', async (req, res) => {
    try {
        let { id, uname, role } = req.body || {};
        if(!id){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000012`,
                msg: 'id不能为空!',
            });
        }
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000013`,
                msg: 'uname不能为空!',
            });
        }

        if(!role) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000014`,
                msg: 'role不能为空!',
            });
        }

        if(!["1", "2"].includes(role)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000015`,
                msg: 'role参数值异常!',
            });
        }

        const body = req.body;
        let sql = "";
        const params = [];
        const generate_time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        [
            "role", "brand_management", "goods_management", 
            "order_management", "user_management", "goods_evaluate_management", 
            "permission_management", "update_time",
        ].forEach((item, index, arr) => {
            sql += `${ item }=${ index < arr.length - 1 ? "? " : "" }`;
            if(["update_time"].includes(item)) {
                params.push(generate_time);
            }else {
                params.push(body[item] || null);
            }
        })
        
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `UPDATE dm_permission SET ${ sql } WHERE id=? and uname=?`,
                [...params, id, uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000016`,
                msg: "更新权限失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "更新权限成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000011`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 删除权限
 */
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params || {};
        if(!id){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000018`,
                msg: 'id不能为空!',
            });
        }
        
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "DELETE FROM dm_permission WHERE id=?",
                [id],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000019`,
                msg: "删除权限失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "删除权限成功!",
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

/**
 * 查询 - 当前用户角色下可操作的用户
 */
router.get("/select/role/uname", async (req, res) => {
    try {
        const [result01, result02] = await kit.promiseAllSettled([
            new Promise((resolve, reject) => {
                req?.pool?.query?.(
                    "SELECT uname FROM dm_user",
                    null,
                    (err, data) => !err ? resolve(data?.map?.(item => item?.uname) || []) : reject(err),
                )
            }),
            new Promise((resolve, reject) => {
                req?.pool?.query?.(
                    "SELECT uname FROM dm_permission",
                    null,
                    (err, data) => !err ? resolve(data?.map?.(item => item?.uname) || []) : reject(err),
                )
            }),
        ]);

        let content = [];
        if(Array.isArray(result01) && result01.length && Array.isArray(result02)) {
            content = result01.filter(item => !result02.includes(item));
        }
        
        res.status(200).send({
            code: "DM-000000",
            content,
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000020`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
})

module.exports = router;