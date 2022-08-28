const express = require('express');
const router = express.Router();
const moment = require('moment');
const lodash  = require('lodash');
const kit = require('./../kit');
// 路由器标识
const ROUTER_Flag = "GOODS_EVALUATE";

/**
 * 根据商品id查询评价
 */
router.get('/public/select/:pid', async (req, res) => {
	const { pid } = req.params || {};
    if(!pid){
        return res.status(400).send({
            code: `DM-${ ROUTER_Flag }-000001`,
            msg: 'pid不能为空!',
        });
    }

    const result01 = await new Promise((resolve, reject) => {
        req?.pool?.query?.(
            `SELECT * FROM dm_comment WHERE pid=${ pid }`, 
            null,
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
                            `SELECT uname, avatar FROM dm_user WHERE uname="${ item }"`,
                            null, 
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
});

/**
 * 确定 - 赞、踩
 * 取消 - 赞、踩
 */
router.put('/update/:id/:action/:operation', async (req, res) => {
    const { id, action, operation, } = req.params || {};
    if(!id){
        return res.status(400).send({
            code: `DM-${ ROUTER_Flag }-000002`,
            msg: 'id不能为空!',
        });
    }

    if(!action){
        return res.status(400).send({
            code: `DM-${ ROUTER_Flag }-000003`,
            msg: 'action不能为空!',
        });
    }

    if(!['agree', 'disagree'].includes(action)){
        return res.status(400).send({
            code: `DM-${ ROUTER_Flag }-000004`,
            msg: 'action仅支持agree、disagree!',
        });
    }

    if(!operation){
        return res.status(400).send({
            code: `DM-${ ROUTER_Flag }-000005`,
            msg: 'operation不能为空!',
        });
    }

    if(!['plus', 'minus'].includes(operation)){
        return res.status(400).send({
            code: `DM-${ ROUTER_Flag }-000006`,
            msg: 'operation仅支持plus、minus!',
        });
    }

    let actionNum = await new Promise((resolve, reject) => {
        req?.pool?.query?.(
            `SELECT ${ action } FROM dm_comment WHERE id=${ id }`, 
            null,
            (err, reuslt) => !err ? resolve(reuslt?.[0]?.[action] || 0) : reject(err),
        )
    });
    
    switch(operation) {
        case "plus":
            actionNum++;
            break;
        case "minus":
            actionNum--;
            break;
    }

    const content = await new Promise((resolve, reject) => {
        req?.pool?.query?.(
            `UPDATE dm_comment SET ${ action }=${ actionNum } WHERE id=${ id }`, 
            null,
            (err, reuslt) => !err ? resolve(reuslt) : reject(err),
        )
    });

    res.status(200).send({
        code: "DM-000000",
        content,
    });
})

// 查询商品
router.get('/select/products', (req, res) => {
	let { id } = req.query || {};
    if( !id ){
        res.status(400).send({
            code: 1,
            msg: 'id不能为空'
        })
        return;
    }
    let sql = "SELECT id, mainPicture, description, price, spec FROM dm_products WHERE id=?";
    req?.pool?.query?.(sql, [id], (err, data) => {
        if(err) throw err;
        res.send({
            code: "DM-000000",
            data: data.length ? data[0] : {},
            
        });
    });
});

// 添加评价
router.post('/add', (req, res) => {
    const { pid, content, uname } = req.body || {};
    if( !uname ){
        res.status(400).send({
            code: 1,
            msg: 'uname不能为空！'
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
    if( !content ){
        res.status(400).send({
            code: 3,
            msg: 'content不能为空！'
        })
        return;
    }else if( content.length > 300 ){
        res.status(400).send({
            code: 4,
            msg: '评价内容不能超过300个字！'
        })
        return;
    }

    let commentTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    let sql = "INSERT INTO dm_comment VALUES (NULL, ?, ?, ?, ?, ?, ?)";
    req?.pool?.query?.(sql, [uname, pid, content, commentTime, 0, 0], (err, data) => {
        if(err) throw err;
        if( data.affectedRows ){
            res.send({
                code: "DM-000000",
                data: null,
                msg: '评价成功'
            })
        }else{
            res.send({
                code: 7,
                msg: '评价失败'
            })
        }
    });
});

// 删除用户评价
router.delete('/delete/:id', (req, res) => {
    const { id } = req.params || {};
    if( !id ){
        res.status(400).send({
            code: 1,
            msg: 'id不能为空！'
        })
        return;
    }
    let sql = "DELETE FROM dm_comment WHERE id=?";
    req?.pool?.query?.(sql, [id], (err, data) => {
        if( err ){
            res.status(503).send({
              code: 2,
              msg: err
            })
        }else{
            if( data.affectedRows ){
                res.send({
                    code: "DM-000000",
                    data: null,
                    msg: '删除用户评价成功'
                })
            }else{
                res.send({
                    code: 3,
                    msg: '删除用户评价失败'
                })
            }
        }
    });
});

// 修改评价
router.put('/update', (req, res) => {
    const { content, id } = req.body || {};
    if( !content ){
        res.status(400).send({
            code: 1,
            msg: 'contents不能为空！'
        })
        return;
    }
    if( !id ){
        res.status(400).send({
            code: 2,
            msg: 'id不能为空！'
        })
        return;
    }

    let commentTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    let sql01 = "UPDATE dm_comment SET content=?, commentTime=? WHERE id = ?";
    req?.pool?.query?.(sql01, [content, commentTime, id], (err, data) => {
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
                  msg: '修改评价成功！'
                })
            }else{
                res.send({
                  code: 5,
                  msg: '修改评价失败！'
                })
            }
        }
    });
});


// 查询所有用户评价
router.post('/select', (req, res) => {
	let { current, pageSize } = req.body || {};
    if( !current ){
        res.status(400).send({
            code: 1,
            msg: 'current不能为空,且大于0'
        })
        return;
    }
    if( !pageSize ){
        res.status(400).send({
            code: 2,
            msg: 'pageSize不能为空'
        })
        return;
    }

    let sql = "SELECT * FROM dm_comment";
    req?.pool?.query?.(sql, null, (err, data) => {
        if(err) throw err;
        let result = {
            // current - 当前页
            current: current - 1,
            // 一页多少条数据
            pageSize: parseInt(pageSize),
            // 数据总数
            total: data.length
        };           
        
        result.products = data.reverse().slice(result.current * result.pageSize, result.current * result.pageSize + result.pageSize);
        result.current = result.current + 1;
        res.send({
            code: "DM-000000",
            data: result,
            
        });
    });
});

module.exports = router;