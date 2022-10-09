const express = require('express');
const router = express.Router();
/**
 * 管理后台 - 商品管理
 */
// 路由器标识
const ROUTER_Flag = "GOODS_MANAGEMENT";

/**
 * 查询 - 商品编号pid
 */
router.get('/select/pids', async (req, res) => {
    try {
        const content = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT id FROM dm_products",
                null, 
                (err, data) => !err ? resolve(data?.map?.(item => item?.id) || []) : reject(err),
            );
        });
    
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

module.exports = router;