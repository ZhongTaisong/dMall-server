const express = require('express');
const router = express.Router();
const moment = require('moment');
const kit = require('./../kit');

// 路由器标识
const ROUTER_Flag = "MESSAGE_BOARD";

/**
 * 查询用户留言
 */
router.get('/public/select', async (req, res) => {
    try {
        const content = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT * FROM dm_message ORDER BY create_time DESC",
                null, 
                (err, reuslt) => !err ? resolve(reuslt) : reject(err),
            );
        });

        const promise_list = [];
        if(Array.isArray(content)) {
            content.forEach(item => {
                promise_list.push(
                    new Promise((resolve, reject) => {
                        req?.pool?.query?.(
                            `SELECT uname, avatar FROM dm_user WHERE uname=?`,
                            [item?.uname], 
                            (err, reuslt) => !err ? resolve(reuslt?.[0] || {}) : reject(err),
                        )
                    })
                );
            });
        }

        const userList = await kit.promiseAllSettled(promise_list);
        if(Array.isArray(content) && Array.isArray(userList)) {
            content.forEach(item => {
                const data = userList.find(item02 => item?.uname === item02?.uname);
                item['avatar'] = data?.['avatar'] || null;
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
 * 发表留言
 */
router.post('/add', async (req, res) => {
    try {
        const { uname } = req.headers || {};
        const { content } = req.body || {};
        if(!uname) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000003`,
                msg: '请求头uname不能为空!',
            });
        }

        if(!content?.trim?.()){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000004`,
                msg: 'content不能为空!',
            });
        }

        if(content.length > 300){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000005`,
                msg: 'content长度限制在300个字内!',
            });
        }

        const reuslt = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "INSERT INTO dm_message VALUES (NULL, ?, ?, ?, ?, ?)",
                [uname, content, moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'), 0, 0], 
                (err, data) => !err ? resolve(data) : reject(err),
            );
        });

        res.status(200).send({
            code: "DM-000000",
            msg: "留言成功!",
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

module.exports = router;