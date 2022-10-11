const express = require('express');
const router = express.Router();
const moment = require('moment');
const kit = require('./../../kit');
const config = require('./../../config');
/**
 * 管理后台 - 用户管理
 */
// 路由器标识
const ROUTER_Flag = "USER_MANAGEMENT";

/**
 * 查询 - 用户列表
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
    
        const [dataSource, total] = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `
                SELECT SQL_CALC_FOUND_ROWS * FROM dm_user ORDER BY update_time DESC LIMIT ?, ?;
                SELECT FOUND_ROWS() as total;
                `,
                [current * pageSize, pageSize], 
                (err, reuslt) => !err ? resolve([reuslt?.[0] || [], reuslt?.[1]?.[0]?.total || 0]) : reject(err),
            );
        });

        if(Array.isArray(dataSource)) {
            dataSource.forEach(item => {
                delete item['upwd'];
            })
        }
    
        res.send({
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
            code: `DM-${ ROUTER_Flag }-000001`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 添加用户
 */
router.post('/add', async (req, res) => {
    try {
        const { uname, upwd, confirmUpwd, email, phone } = req.body || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000007`,
                msg: 'uname不能为空!',
            });
        }else if(uname.length < 2 || uname.length > 64) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000008`,
                msg: 'uname限制在2到64个字符!',
            });
        }

        if(!upwd){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000009`,
                msg: 'upwd不能为空!',
            });
        }

        if(!confirmUpwd){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000010`,
                msg: 'confirmUpwd不能为空!',
            });
        }

        if(!email){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000011`,
                msg: 'email不能为空!',
            });
        }

        if(!phone){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000012`,
                msg: 'phone不能为空!',
            });
        }

        if(!kit.validatePhone(phone)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000013`,
                msg: '请传入合法的phone!',
            });
        }

        const isUname = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT uname FROM dm_user WHERE uname=?", 
                [uname],
                (err, data) => !err ? resolve(Boolean(data?.length)) : reject(err),
            )
        });
        if(isUname) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000014`,
                msg: '此用户名已被注册!',
            });
        }

        const pwdKey = kit.getUuid();
        const time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        const nickName = uname;
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "INSERT INTO dm_user (uname, upwd, email, phone, avatar, ukey, gender, birthday, nickName, admin_status, create_time, update_time) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                [uname, kit.md5(`${ upwd }${ pwdKey }`), email, phone, null, pwdKey, 2, time, nickName, 0, time, time],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000015`,
                msg: "添加用户失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "添加用户成功!",
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
 * 更新用户
 */
router.patch('/update', async (req, res) => {
    try {
        const { id, uname, phone, email, } = req.body || {};
        if(!id){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000017`,
                msg: 'id不能为空!',
            });
        }

        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000018`,
                msg: 'uname不能为空!',
            });
        }else if(uname.length < 2 || uname.length > 64) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000019`,
                msg: 'uname限制在2到64个字符!',
            });
        }

        if(!email){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000020`,
                msg: 'email不能为空!',
            });
        }

        if(!phone){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000021`,
                msg: 'phone不能为空!',
            });
        }

        if(!kit.validatePhone(phone)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000022`,
                msg: '请传入合法的phone!',
            });
        }
        
        // 操作时间
        const time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "UPDATE dm_user SET phone=?, email=?, update_time=? WHERE id=? AND uname=?",
                [phone, email, time, id, uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000023`,
                msg: "更新用户失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "更新用户成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000016`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 删除用户
 */
router.delete('/delete/:uname/:id', async (req, res) => {
    try {
        const { id, uname, } = req.params || {};
        if(!id){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000025`,
                msg: 'id不能为空!',
            });
        }

        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000026`,
                msg: 'uname不能为空!',
            });
        }
        
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "DELETE FROM dm_user WHERE id=? AND uname=?",
                [id, uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000033`,
                msg: "删除用户失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "删除用户成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000024`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 重置用户密码
 */
router.patch('/update/reset-password', async (req, res) => {
    try {
        const { id, uname, } = req.body || {};
        if(!id){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000028`,
                msg: 'id不能为空!',
            });
        }

        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000029`,
                msg: 'uname不能为空!',
            });
        }else if(uname.length < 2 || uname.length > 64) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000030`,
                msg: 'uname限制在2到64个字符!',
            });
        }

        const ukey = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT ukey FROM dm_user WHERE uname=?", 
                [uname],
                (err, data) => !err ? resolve(data?.[0]?.ukey) : reject(err),
            )
        });

        if(!ukey) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000031`,
                msg: 'uname尚未注册!',
            });
        }
        
        // 操作时间
        const time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        const init_pwd = kit.getInitPassword();
        const upwd = kit.md5(`${ init_pwd }${ ukey }`);
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "UPDATE dm_user SET upwd=?, update_time=? WHERE id=? AND uname=?",
                [upwd, time, id, uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000032`,
                msg: "重置用户密码失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            content: init_pwd,
            msg: null,
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000027`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

module.exports = router;