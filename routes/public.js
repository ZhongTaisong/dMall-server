const express = require('express');
const router = express.Router();
const pool = require('../pool');

/**
 * 查询 - 热门推荐商品
 */
router.get('/hot-recommendations', (req, res) => {
	pool.query(
        "SELECT id, mainPicture, price, productName, description FROM dm_products WHERE hot=?", 
        [101], 
        (err, result) => {
            if(err) {
                return res.status(500).send({
                    code: "DM-000005",
                    msg: '操作失败!',
                    error: err,
                });
            };

            res.send({
                code: "DM-000000",
                content: result,
            });
        }
    );
});

/**
 * 查询 - 单品推广商品
 */
router.get('/single-product-promotion', (req, res) => {
	pool.query(
        "SELECT id, mainPicture, price, productName, description FROM dm_products WHERE single=?", 
        [102], 
        (err, result) => {
            if(err) {
                return res.status(500).send({
                    code: "DM-000006",
                    msg: '操作失败!',
                    error: err,
                });
            };

            res.send({
                code: "DM-000000",
                content: result,
            });
        }
    );
});

/**
 * 查询 - 大图推广商品
 */
router.get('/large-scale-promotion', (req, res) => {
	pool.query(
        "SELECT id, bannerPic, description FROM dm_products WHERE banner=?", 
        [103], 
        (err, result) => {
            if(err) {
                return res.status(500).send({
                    code: "DM-000007",
                    msg: '操作失败!',
                    error: err,
                });
            };

            res.send({
                code: "DM-000000",
                content: result,
            });
        }
    );
});

// 关键字搜索
router.get('/kw', (req,res) => {
    const { kws } = req.query || {};
    let sql = "SELECT * FROM dm_products WHERE description LIKE ?";
    let ks = `%${kws}%`;
    pool.query(sql, [ks], (err, data) => {
        if(err) throw err;
        res.send({
            code: 200,
            data,
            
        })
    });
});

module.exports = router;