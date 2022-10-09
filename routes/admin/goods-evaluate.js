const express = require('express');
const router = express.Router();
/**
 * 管理后台 - 评价管理
 */
// 路由器标识
const ROUTER_Flag = "GOODS_EVALUATE_MANAGEMENT";

/**
 * 分页查询 - 评价列表
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
                SELECT SQL_CALC_FOUND_ROWS * FROM dm_comment ORDER BY update_time DESC LIMIT ?, ?;
                SELECT FOUND_ROWS() as total;
                `,
                [current * pageSize, pageSize], 
                (err, reuslt) => !err ? resolve([reuslt?.[0] || [], reuslt?.[1]?.[0]?.total || 0]) : reject(err),
            );
        });
    
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
 * 删除评价
 */
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params || {};
        if(!id){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000007`,
                msg: 'id不能为空!',
            });
        }
        
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "DELETE FROM dm_comment WHERE id=?",
                [id],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000008`,
                msg: "删除评价失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "删除评价成功!",
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

module.exports = router;