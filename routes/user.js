const express = require('express');
const router = express.Router();
const moment = require('moment');
const uuid = require('uuid');
const fs = require('fs');
const crypto = require('crypto');
// 生成token
const jwt = require('jsonwebtoken');
const config = require('./../config');
const kit = require('./../kit');

// multer上传图片相关设置
const multer  = require('multer');
const dest = 'public/img';
let upload = multer() // 文件储存路径
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
        const _uuid = uuid.v4();
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
        });
    }
});

/**
 * 更新登录密码
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
        });
    }
})

// 重置用户密码
router.put('/resetUpwd', (req, res) => {
    let { id, upwd, ukey } = req.body || {};
    if( !id ){
        res.status(400).send({
            code: 1,
            msg: 'uid不能为空'
        });
        return;
    }
    if( !upwd ){
        res.status(400).send({
            code: 2,
            msg: 'upwd不能为空'
        });
        return;
    }
    if( !ukey ){
        res.status(400).send({
            code: 3,
            msg: 'ukey不能为空'
        });
        return;
    }
    // 加密密码
    upwd = require('crypto').createHash('md5').update( upwd + ukey ).digest('hex');
    let sql = "UPDATE dm_user SET upwd=? WHERE id=?";    
    req?.pool?.query?.(sql, [upwd, id], (err, data) => {
        if( err ){
            res.status(503).send({
                code: 4,
                msg: err
            })
        }else{
            if( data.affectedRows ){
                res.send({
                    code: "DM-000000",
                    data: null,
                    msg: '重置用户密码成功'
                })
            }else{
                res.send({
                    code: 5,
                    msg: '重置用户密码失败'
                })
            }
        }
    })
});

// 查询所有用户
router.post('/select', (req, res) => {
	let { current=1, pageSize } = req.body || {};
    if( !current ){
        res.status(400).send({
            code: 1,
            msg: 'current不能为空,且大于0'
        })
        return;
    }

    let sql = "SELECT * FROM dm_user";
    req?.pool?.query?.(sql, null, (err, data) => {
        if( err ){
            res.status(503).send({
                code: 1,
                msg: err
            })
        }else{
            data.forEach(item => {
                delete item.upwd;
            })
            let result = {
                // current - 当前页
                current: current - 1,
                // 一页多少条数据
                pageSize: pageSize ? parseInt(pageSize) : data.length,
                // 数据总数
                total: data.length
            };           
            
            result.products = data.reverse().slice(result.current * result.pageSize, result.current * result.pageSize + result.pageSize);
            result.current = result.current + 1;
            res.send({
                code: "DM-000000",
                data: result,
                
            });
        }
    });
});

// 删除用户
router.delete('/delete/:id', (req, res) => {
    let { id } = req.params || {};
    if( !id ){
        res.status(400).send({
            code: 1,
            msg: 'uid不能为空'
        });
        return;
    }
    let sql = "DELETE FROM dm_user WHERE id=?";
    req?.pool?.query?.(sql, [id], (err, data) => {
        if( err ){
            res.status(503).send({
                code: 2,
                msg: err
            })
        }else{
            // avatar && fs.exists(`public/${avatar}`, exists => {
            //     if( exists ){
            //         fs.unlink(`public/${avatar}`, (err) => {
            //             if( err ) throw err;
            //         });
            //     }
            // });
            if( data.affectedRows ){
                res.send({
                    code: "DM-000000",
                    data: null,
                    msg: '删除用户成功'
                })
            }else{
                res.send({
                    code: 3,
                    msg: '删除用户失败'
                })
            }
        }
    })
});

// 注册
router.post('/reg', (req, res) => {
    // 随机key值
    const pwdKey = Math.random().toString().slice(2);
    const { uname } = req.headers || {};
    let { upwd, email, phone } = req.body || {};
    if( !uname ){
        res.status(400).send({
          code: 1,
          msg: '用户名不能为空！'
        })
        return;
    }
    if( !upwd ){
        res.status(400).send({
          code: 2,
          msg: '密码不能为空！'
        })
        return;
    }else{
        upwd = require('crypto').createHash('md5').update( upwd + pwdKey ).digest('hex');
    }
    if( !email ){
        res.status(400).send({
          code: 3,
          msg: '邮箱不能为空！'
        })
        return;
    }
    if( !phone ){
        res.status(400).send({
          code: 4,
          msg: '手机号码不能为空！'
        })
        return;
    }
    // 用户名是否已被注册？
    let sql01 = "SELECT uname FROM dm_user WHERE uname = ?";
    req?.pool?.query?.(sql01, [uname], (err, result01) => {
        if( err ){
            res.status(503).send({
                code: 5,
                msg: err
            })
        }else{
            if( result01.length ){
                res.send({
                    code: 201,
                    msg: '此用户名已被注册！'
                });
            }else{
                let sql02 = "INSERT INTO dm_user VALUES(NULL, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)";
                let time = moment( Date.now() ).format('YYYY-MM-DD HH:mm:ss');
                req?.pool?.query?.(sql02, [uname, upwd, email, phone, pwdKey, 2, time, uname, 0], (err, result02) => {
                    if( err ){
                      res.status(503).send({
                        code: 6,
                        msg: err
                      })
                    }else{
                        if( result02.affectedRows ){
                            res.send({
                                code: "DM-000000",
                                data: uname,
                                msg: '恭喜你，注册成功！'
                            });
                        }else{
                            res.status(404).send({
                                code: 7,
                                msg: '很遗憾，注册失败！'
                            })
                        }
                    }
                });
            }
        }
    });
});

// token认证
router.post('/oauth', (req, res) => {
    const { token } = req.headers || {};
    if( !token ){
        res.send({
            code: 401,
            msg: '认证token不存在，重新登录！'
        })
        return;
    }

    let sql = "SELECT uname, upwd, admin FROM dm_user WHERE upwd = ?";
    req?.pool?.query?.(sql, [ token ], (err, data) => {
        if( err ){
            res.status(503).send({
                code: 2,
                msg: err
            })
        }else{
            if( data.length ){
                res.send({
                    code: "DM-000000",
                    data: {
                        uname: data[0].uname,
                        token: data[0].upwd,
                        admin: data[0].admin
                    },
                    msg: '认证通过'
                })
            }else{
                res.send({
                    code: 401,
                    msg: '认证token不存在，重新登录！'
                })
            }
        }
    });
});

module.exports = router;