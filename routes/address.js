const express = require('express');
const router = express.Router();
const kit = require('./../kit');
/**
 * 收货地址
 */
// 路由器标识
const ROUTER_Flag = "ADDRESS";

/**
 * 查询 - 收货地址
 */
router.get('/select', async (req, res) => {
    try {
        const { uname } = req.headers || {};
        if(!uname) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000002`,
                msg: '请求头uname不能为空!',
            });
        }

        const content = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `SELECT * FROM dm_address WHERE uname=? ORDER BY id DESC`, 
                [uname], 
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(Array.isArray(content)) {
            content.forEach(item => {
                item['isDefault'] = Number(item['isDefault'] || '0');
            })
        }
        
        res.status(200).send({
            code: "DM-000000",
            content,
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
 * 添加 - 收货地址
 */
router.post('/add', async (req, res) => {
    try {
        const { uname } = req.headers || {};
        const { name, region, detail, phone, isDefault=0 } = req?.body || {};
        if(!uname) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000004`,
                msg: '请求头uname不能为空!',
            });
        }

        if(!name) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000005`,
                msg: 'name不能为空!',
            });
        }

        if(!region) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000006`,
                msg: 'region不能为空!',
            });
        }

        if(!detail) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000007`,
                msg: 'detail不能为空!',
            });
        }

        if(!phone) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000008`,
                msg: 'phone不能为空!',
            });
        }

        if(!kit.validatePhone(phone)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000009`,
                msg: '请传入合法的phone!',
            });
        }

        if(isDefault){
            await new Promise((resolve, reject) => {
                req?.pool?.query?.(
                    "UPDATE dm_address SET isDefault=? WHERE uname=?", 
                    [0, uname],
                    (err, data) => !err ? resolve(Boolean(data?.affectedRows)) : reject(err),
                )
            });
        }

        const reuslt = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "INSERT INTO dm_address VALUES(NULL, ?, ?, ?, ?, ?, ?)", 
                [uname, name, region, detail, phone, isDefault],
                (err, data) => !err ? resolve(Boolean(data?.affectedRows)) : reject(err),
            )
        });
        
        if(!reuslt) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000010`,
                msg: "添加失败!",
            });
        }

        res.status(200).send({
            code: "DM-000000",
            msg: "添加成功!",
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
 * 修改 - 收货地址
 */
router.put('/update', async (req, res) => {
    try {
        const { uname } = req.headers || {};
        const { id, name, region, detail, phone, isDefault=0 } = req?.body || {};
        if(!id) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000012`,
                msg: 'id不能为空!',
            });
        }

        if(!name) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000013`,
                msg: 'name不能为空!',
            });
        }

        if(!region) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000014`,
                msg: 'region不能为空!',
            });
        }

        if(!detail) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000015`,
                msg: 'detail不能为空!',
            });
        }

        if(!phone) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000016`,
                msg: 'phone不能为空!',
            });
        }

        if(!kit.validatePhone(phone)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000017`,
                msg: '请传入合法的phone!',
            });
        }
        if(!uname) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000018`,
                msg: '请求头uname不能为空!',
            });
        }

        if(isDefault){
            await new Promise((resolve, reject) => {
                req?.pool?.query?.(
                    "UPDATE dm_address SET isDefault=? WHERE uname=?", 
                    [0, uname],
                    (err, data) => !err ? resolve(Boolean(data?.affectedRows)) : reject(err),
                )
            });
        }

        const reuslt = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "UPDATE dm_address SET name=?, region=?, detail=?, phone=?, isDefault=? WHERE uname=? AND id=?", 
                [name, region, detail, phone, isDefault, uname, id],
                (err, data) => !err ? resolve(Boolean(data?.affectedRows)) : reject(err),
            )
        });
        
        if(!reuslt) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000019`,
                msg: "修改失败!",
            });
        }

        res.status(200).send({
            code: "DM-000000",
            msg: "修改成功!",
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
 * 删除 - 收货地址
 */
router.delete('/delete/:id', async (req, res) => {
    try {
        const { uname } = req.headers || {};
        const { id } = req?.params || {};
        if(!uname) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000021`,
                msg: '请求头uname不能为空!',
            });
        }

        if(!id) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000022`,
                msg: 'id不能为空!',
            });
        }

        const reuslt = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "DELETE FROM dm_address WHERE id=? AND uname=?", 
                [id, uname],
                (err, data) => !err ? resolve(Boolean(data?.affectedRows)) : reject(err),
            )
        });
        
        if(!reuslt) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000023`,
                msg: "删除失败!",
            });
        }

        res.status(200).send({
            code: "DM-000000",
            msg: "删除成功!",
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