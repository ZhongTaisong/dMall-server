const express = require('express');
const router = express.Router();
const moment = require('moment');
// 生成token
const jwt = require('jsonwebtoken');
const config = require('./../config');
const kit = require('./../kit');
/**
 * 用户
 */
// 路由器标识
const ROUTER_Flag = "USER";

/**
 * 登录
 */
router.post('/public/login', async (req, res) => {
    try {
        const { uname, upwd, isRemember, } = req.body || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000001`,
                msg: 'uname不能为空!',
            });
        }

        if(!upwd){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000002`,
                msg: 'upwd不能为空!',
            });
        }

        const ukey = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `SELECT ukey FROM dm_user WHERE uname=?`, 
                [ uname ],
                (err, reuslt) => !err ? resolve(reuslt?.[0]?.ukey || null) : reject(err),
            )
        });

        if(!ukey) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000003`,
                msg: '用户名不存在!',
            });
        }

        const new_upwd = kit.md5(`${ upwd }${ ukey }`);
        const reuslt02 = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `SELECT * FROM dm_user WHERE uname=? AND upwd=?`, 
                [ uname, new_upwd ],
                (err, reuslt) => !err ? resolve(reuslt) : reject(err),
            )
        });

        if(!Array.isArray(reuslt02) || !reuslt02.length) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000004`,
                msg: '密码错误!',
            });
        }

        const content = reuslt02?.[0] || {};
        /**
         * isRemember - 记住密码
         * 
         * 为true时，最长 3 天，
         * 反之，3 个小时
         */
        const tokenStr = jwt.sign({ uname, }, config.SECRET_KEY, { 
            expiresIn: isRemember ? '3 days' : '3h',
        });
        content['token'] = `Bearer ${ tokenStr }`;

        const avatar = content?.['avatar'];
        if(avatar) {
            content['avatar'] = `${ config.REQUEST_URL }${ config.AVATAR_PATH }/${ avatar }`;
        }

        delete content['upwd'];
        delete content['ukey'];
        res.status(200).send({
            code: "DM-000000",
            content,
            msg: "登录成功!",
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
 * 退出登录
 */
router.get('/public/logout', (req, res) => {
    try {
        const { uname, authorization, } = req.headers;
        // 将当前token存入redis黑名单
        kit.setRedisHashValue(config.REDIS_KEY.DMALL_JWT_BLACKLIST, {
            [uname]: authorization.slice(7),
        });
    
        res.status(200).send({
            code: "DM-000000",
            msg: '已成功退出登录!',
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
 * 验证用户信息
 */
router.post('/public/validate', async (req, res) => {
    try {
        const { uname, email, phone } = req.body || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000007`,
                msg: 'uname不能为空!',
            });
        }

        if(!email){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000008`,
                msg: 'email不能为空!',
            });
        }

        if(!phone){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000009`,
                msg: 'phone不能为空!',
            });
        }

        if(!kit.validatePhone(phone)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000032`,
                msg: '请传入合法的phone!',
            });
        }

        const reuslt = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT email, phone, uname, upwd FROM dm_user WHERE uname=?", 
                [uname],
                (err, data) => !err ? resolve(data?.[0] || {}) : reject(err),
            )
        });

        if(!reuslt || !Object.keys(reuslt).length) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000010`,
                msg: '用户名不存在!',
            });
        }
        
        if(reuslt?.phone && reuslt?.phone !== phone) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000011`,
                msg: '输入的手机号码 和 预留的手机号码不一致!',
            });
        }
        
        if(reuslt?.email && reuslt?.email !== email) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000012`,
                msg: '输入的邮箱 和 预留的邮箱不一致!',
            });
        }

        // 生成 - 临时验证通过凭证
        const _uuid = kit.getUuid()
        // 存入redis
        kit.setRedisHashValue(_uuid, {
            uname, email, phone,
        });
        /**
         * 验证通过凭证
         * 
         * 5分钟内有效
         */
        kit.setRedisExpireTime(_uuid, 5 * 60);

        res.status(200).send({
            code: "DM-000000",
            content: {
                temporaryToken: _uuid,
            },
            msg: '信息验证通过!',
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

/**
 * 忘记密码 - 更新登录密码
 */
router.patch('/public/update/password', async (req, res) => {
    try {
        const { newPwd, temporaryToken, } = req.body || {};
        if(!newPwd){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000015`,
                msg: 'newPwd不能为空!',
            });
        }

        if(!temporaryToken){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000016`,
                msg: 'temporaryToken不能为空!',
            });
        }

        const userInfo = await kit.getRedisHashValueAll(temporaryToken);
        if(!userInfo || !Object.keys(userInfo).length) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000017`,
                msg: 'temporaryToken已失效, 请重新验证信息!',
            });
        }

        const { uname, email, phone, } = userInfo;
        const ukey = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT ukey FROM dm_user WHERE uname=? AND email=? AND phone=?", 
                [uname, email, phone],
                (err, data) => !err ? resolve(data?.[0]?.ukey) : reject(err),
            )
        });

        await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "UPDATE dm_user SET upwd=? WHERE uname=?", 
                [kit.md5(`${ newPwd }${ ukey }`), uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        res.status(200).send({
            code: "DM-000000",
            msg: "登录密码更新成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000014`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
})

/**
 * 注册
 */
router.post('/public/register', async (req, res) => {
    try {
        const { uname, upwd, confirmUpwd, email, phone } = req.body || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000019`,
                msg: 'uname不能为空!',
            });
        }else if(uname.length < 2 || uname.length > 64) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000025`,
                msg: 'uname限制在2到64个字符!',
            });
        }

        if(!upwd){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000020`,
                msg: 'upwd不能为空!',
            });
        }

        if(!confirmUpwd){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000021`,
                msg: 'confirmUpwd不能为空!',
            });
        }

        if(!email){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000022`,
                msg: 'email不能为空!',
            });
        }

        if(!phone){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000023`,
                msg: 'phone不能为空!',
            });
        }

        if(!kit.validatePhone(phone)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000033`,
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
                code: `DM-${ ROUTER_Flag }-000024`,
                msg: '此用户名已被注册!',
            });
        }

        const pwdKey = kit.getUuid();
        const date = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        const nickName = uname;
        await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "INSERT INTO dm_user VALUES(NULL, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)", 
                [uname, kit.md5(`${ upwd }${ pwdKey }`), email, phone, pwdKey, 2, date, nickName, 0],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });
        
        res.status(200).send({
            code: "DM-000000",
            msg: "恭喜你，注册成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000018`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 更新用户信息
 */
router.put('/update/user-information', (req, res, next) => {
    const { uname } = req.headers || {};
    if(!uname){
        return res.status(400).send({
            code: `DM-${ ROUTER_Flag }-000043`,
            msg: '请求头uname不能为空!',
        });
    }

    kit.upload(config.AVATAR_PATH)(kit.md5(uname)).single('avatar')(req, res, next);

}, async (req, res) => {
    try {
        let { user_info, } = req.body || {};
        const { filename, } = req.file || {};
        try {
            user_info = JSON.parse(user_info || '{}');
        } catch (error) {
            user_info = {};
        }

        if(!user_info || !Object.keys(user_info).length) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000042`,
                msg: 'user_info不能为空!',
            });
        }

        const { id, nickName, phone, birthday, gender, } = user_info || {};
        if(!id){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000031`,
                msg: 'id不能为空!',
            });
        }

        if(!phone){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000027`,
                msg: 'phone不能为空!',
            });
        }

        if(!kit.validatePhone(phone)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000028`,
                msg: '请传入合法的phone!',
            });
        }

        if(!birthday){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000029`,
                msg: 'birthday不能为空!',
            });
        }

        if(![0, 1, 2].includes(Number(gender))){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000030`,
                msg: '请传入合法的gender(0男, 1女, 2保密)!',
            });
        }

        const params = [nickName, phone, birthday, gender, id];
        if(filename) {
            params.unshift(filename);
        }
        await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `UPDATE dm_user SET ${ filename ? "avatar=?, " : "" }nickName=?, phone=?, birthday=?, gender=? WHERE id=?`, 
                params,
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });
        
        res.status(200).send({
            code: "DM-000000",
            msg: "更新成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000026`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 查询用户信息
 */
router.get('/select/user-information', async (req, res) => {
    try {
        const { uname } = req.headers || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000035`,
                msg: '请求头uname不能为空!',
            });
        }

        const content = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT id, uname, phone, gender, birthday, nickName, avatar FROM dm_user WHERE uname=?", 
                [uname],
                (err, data) => !err ? resolve(data?.[0] || {}) : reject(err),
            )
        });

        const avatar = content?.['avatar'];
        if(avatar) {
            content['avatar'] = `${ config.REQUEST_URL }${ config.AVATAR_PATH }/${ avatar }`;
        }
        
        res.status(200).send({
            code: "DM-000000",
            content,
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000034`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 修改登录密码
 */
router.patch('/update/password', async (req, res) => {
    try {
        const { uname, } = req?.headers || {};
        const { oldPwd, newPwd, } = req.body || {};
        if(!uname){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000037`,
                msg: '请求头uname不能为空!',
            });
        }
        if(!oldPwd){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000038`,
                msg: 'oldPwd不能为空!',
            });
        }

        if(!newPwd){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000039`,
                msg: 'newPwd不能为空!',
            });
        }

        const ukey = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT ukey FROM dm_user WHERE uname=?", 
                [uname],
                (err, data) => !err ? resolve(data?.[0]?.ukey) : reject(err),
            )
        });

        const reuslt = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `SELECT * FROM dm_user WHERE uname=? AND upwd=?`, 
                [ uname, kit.md5(`${ oldPwd }${ ukey }`) ],
                (err, reuslt) => !err ? resolve(reuslt) : reject(err),
            )
        });

        if(!Array.isArray(reuslt) || !reuslt.length) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000040`,
                msg: '旧密码错误!',
            });
        }

        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "UPDATE dm_user SET upwd=? WHERE uname=?", 
                [kit.md5(`${ newPwd }${ ukey }`), uname],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000041`,
                msg: "登录密码更新失败!",
            });
        }

        res.status(200).send({
            code: "DM-000000",
            msg: "登录密码更新成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000036`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
})

module.exports = router;