const express = require('express');
const fsExtra = require('fs-extra');
const path = require("path");
const config = require('./../../config');
const kit = require('./../../kit');
const moment = require('moment');
const router = express.Router();
const lodash = require('lodash');
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
                "SELECT id FROM dm_goods",
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
            code: `DM-${ ROUTER_Flag }-000006`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 分页查询 - 商品列表
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
                SELECT SQL_CALC_FOUND_ROWS goods.*, brands.brand_name FROM dm_goods as goods, dm_brands as brands WHERE goods.brand_id=brands.brand_id ORDER BY goods.update_time DESC LIMIT ?, ?;
                SELECT FOUND_ROWS() as total;
                `,
                [current * pageSize, pageSize], 
                (err, reuslt) => !err ? resolve([reuslt?.[0] || [], reuslt?.[1]?.[0]?.total || 0]) : reject(err),
            );
        });

        if(Array.isArray(dataSource)) {
            dataSource.forEach(item => {
                const banner_picture = item?.['banner_picture'];
                if(banner_picture) {
                    item['banner_picture'] = `${ config.REQUEST_URL }${ config.BANNER_PATH }/${ banner_picture }`;
                }

                const main_picture = item?.['main_picture'];
                if(main_picture) {
                    item['main_picture'] = `${ config.REQUEST_URL }${ config.GOODS_MAIN_PATH }/${ main_picture }`;
                }

                const goods_picture = item?.['goods_picture']?.split?.("|") || [];
                if(Array.isArray(goods_picture)) {
                    item['goods_picture'] = goods_picture.map(item => {
                        return item ? `${ config.REQUEST_URL }${ config.GOODS_MAIN_PATH }/${ item }` : null;
                    }).filter(item => item);
                }

                const detail_picture = item?.['detail_picture']?.split?.("|") || [];
                if(Array.isArray(detail_picture)) {
                    item['detail_picture'] = detail_picture.map(item => {
                        return item ? `${ config.REQUEST_URL }${ config.GOODS_DETAIL_PATH }/${ item }` : null;
                    }).filter(item => item);
                }
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
 * 添加商品
 */
router.post('/add', kit.upload().fields([
    { name: 'main_picture', maxCount: 1 },
    { name: 'goods_picture', maxCount: 4 },
    { name: 'detail_picture', maxCount: 5 },
  ]), async (req, res) => {
    try {
        let { goods_info, } = req.body || {};
        const { main_picture, goods_picture, detail_picture, } = req.files || {};
        try {
            goods_info = JSON.parse(goods_info || '{}');
        } catch (error) {
            goods_info = {};
        }

        if(!goods_info || !Object.keys(goods_info).length) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000008`,
                msg: 'goods_info不能为空!',
            });
        }

        if(!Array.isArray(main_picture) || !main_picture.length) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000009`,
                msg: 'main_picture不能为空!',
            });
        }

        goods_info['main_picture'] = main_picture.map(item => item?.filename).join("|");

        if(Array.isArray(goods_picture) && goods_picture.length) {
            goods_info['goods_picture'] = goods_picture.map(item => item?.filename).join("|");
        }

        if(Array.isArray(detail_picture) && detail_picture.length) {
            goods_info['detail_picture'] = detail_picture.map(item => item?.filename).join("|");
        }

        const time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        goods_info = {
            ...goods_info,
            create_time: time,
            update_time: time,
            status: 1,
            recommend_status: 0,
            banner_status: 0,
        };

        let sql_key = "";
        let sql_value = "";
        const params = [];
        Object.entries(goods_info).forEach(([key, value], index, arr) => {
            sql_key += `${ key }${ index < arr.length - 1 ? ", " : "" }`;
            sql_value += `?${ index < arr.length - 1 ? ", " : "" }`;
            params.push(value ?? null);
        });

        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `INSERT INTO dm_goods (${ sql_key }) VALUES(${ sql_value })`, 
                params,
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000010`,
                msg: "添加商品失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "添加商品成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000007`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 更新商品
 */
router.put('/update', kit.upload().fields([
    { name: 'main_picture', maxCount: 1 },
    { name: 'goods_picture', maxCount: 4 },
    { name: 'detail_picture', maxCount: 5 },
  ]), async (req, res) => {
    try {
        let { id, goods_info, } = req.body || {};
        let { main_picture, goods_picture, detail_picture, } = req.files || {};
        if(!id) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000012`,
                msg: 'id不能为空!',
            });
        }

        try {
            goods_info = JSON.parse(goods_info || '{}');
        } catch (error) {
            goods_info = {};
        }

        if(!goods_info || !Object.keys(goods_info).length) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000013`,
                msg: 'goods_info不能为空!',
            });
        }

        if(goods_info['main_picture']) {
            const prefix = `${ config.REQUEST_URL }${ config.GOODS_MAIN_PATH }/`;
            const picture_new = goods_info?.['main_picture']?.replace?.(prefix, "");
            if(picture_new) {
                goods_info['main_picture'] = picture_new;
            }
        }

        if(Array.isArray(goods_info?.['goods_picture'])) {
            const prefix = `${ config.REQUEST_URL }${ config.GOODS_MAIN_PATH }/`;
            const picture_new = goods_info?.['goods_picture'].map(item => item?.replace?.(prefix, ""));
            if(Array.isArray(picture_new)) {
                goods_info['goods_picture'] = picture_new.join("|") || null;
            }
        }

        if(Array.isArray(goods_info?.['detail_picture'])) {
            const prefix = `${ config.REQUEST_URL }${ config.GOODS_DETAIL_PATH }/`;
            const picture_new = goods_info?.['detail_picture'].map(item => item?.replace?.(prefix, ""));
            if(Array.isArray(picture_new)) {
                goods_info['detail_picture'] = picture_new.join("|") || null;
            }
        }

        if(Array.isArray(main_picture) && main_picture.length) {
            goods_info['main_picture'] = main_picture.map(item => item?.filename).join("|") || null;
        }

        if(Array.isArray(goods_picture) && goods_picture.length) {
            goods_picture = goods_picture.map(item => item?.filename);
            if(goods_info['goods_picture']) {
                goods_picture.unshift(goods_info['goods_picture']);
            }
            goods_info['goods_picture'] = goods_picture.join("|") || null;
        }

        if(Array.isArray(detail_picture) && detail_picture.length) {
            detail_picture = detail_picture.map(item => item?.filename);
            if(goods_info['detail_picture']) {
                detail_picture.unshift(goods_info['detail_picture']);
            }
            goods_info['detail_picture'] = detail_picture.join("|") || null;
        }

        const pictures = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT main_picture, goods_picture, detail_picture FROM dm_goods WHERE id=?", 
                [id],
                (err, data) => !err ? resolve(data?.[0] || {}) : reject(err),
            )
        });

        if(pictures && Object.keys(pictures).length) {
            Object.entries(goods_info).forEach(([key, value]) => {
                if(["main_picture", "goods_picture", "detail_picture"].includes(key)) {
                    const pictures_list = pictures?.[key]?.split?.("|") || [];
                    const value_list = value?.split?.("|") || [];

                    const prefix_path = {
                        main_picture: config.GOODS_MAIN_PATH,
                        goods_picture: config.GOODS_MAIN_PATH,
                        detail_picture: config.GOODS_DETAIL_PATH,
                    }[key];

                    if(prefix_path) {
                        if(!value_list?.length) {
                            if(pictures_list?.length) {
                                kit.promiseAllSettled(
                                    pictures_list.reduce((data, item) => {
                                        const pathname = path.join(__dirname, "..", "..", '.', `${ prefix_path }/${ item }`);
                                        data.push(fsExtra.remove(pathname));
                                        return data;
                                    }, [])
                                );
                            }
                        }else {
                            const arr = lodash.difference(pictures_list, value_list);
                            if(arr.length) {
                                kit.promiseAllSettled(
                                    arr.reduce((data, item) => {
                                        const pathname = path.join(__dirname, "..", "..", '.', `${ prefix_path }/${ item }`);
                                        data.push(fsExtra.remove(pathname));
                                        return data;
                                    }, [])
                                );
                            }
                        }
                    }

                }
            })
        }

        const time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        goods_info = {
            ...goods_info,
            update_time: time,
        };

        let sql = "";
        const params = [];
        Object.entries(goods_info).forEach(([key, value], index, arr) => {
            sql += `${ key }=?${ index < arr.length - 1 ? ", " : "" }`;
            params.push(value ?? null);
        });

        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `UPDATE dm_goods SET ${ sql } WHERE id=?`, 
                [...params, id],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000015`,
                msg: "更新商品失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "更新商品成功!",
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
 * 上架、下架
 */
router.patch('/update/status', async (req, res) => {
    try {
        const { id, status, } = req.body || {};
        if(!id) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000017`,
                msg: 'id不能为空!',
            });
        }

        if(![0, 1].includes(status)) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000018`,
                msg: 'status值仅支持number类型的0 或 1',
            });
        }
    
        const update_time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "UPDATE dm_goods SET status=?, update_time=? WHERE id=?", 
                [status, update_time, id],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000019`,
                msg: "操作失败!",
            });
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "操作成功!",
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
 * 删除商品
 */
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params || {};
        if(!id){
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000021`,
                msg: 'id不能为空!',
            });
        }

        const pictures = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT main_picture, goods_picture, detail_picture, banner_picture FROM dm_goods WHERE id=?", 
                [id],
                (err, data) => !err ? resolve(data?.[0] || {}) : reject(err),
            )
        });
        
        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "DELETE FROM dm_goods WHERE id=?",
                [id],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000022`,
                msg: "删除商品失败!",
            });
        }

        const promise_list = [];
        if(pictures && Object.keys(pictures).length) {
            Object.entries(pictures).forEach(([key, value]) => {
                const prefix_path = {
                    main_picture: config.GOODS_MAIN_PATH,
                    goods_picture: config.GOODS_MAIN_PATH,
                    detail_picture: config.GOODS_DETAIL_PATH,
                    banner_picture: config.BANNER_PATH,
                }[key];
                if(prefix_path) {
                    const value_list = value?.split?.("|") || [];
                    if(Array.isArray(value_list) && value_list.length) {
                        value_list.forEach(item => {
                            const pathname = path.join(__dirname, "..", "..", '.', `${ prefix_path }/${ item }`);
                            promise_list.push(fsExtra.remove(pathname));
                        })
                    }
                }
            })
        }

        if(Array.isArray(promise_list) && promise_list.length) {
            kit.promiseAllSettled(promise_list);
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "删除商品成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000020`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

/**
 * 推广商品
 */
router.patch('/update/recommend', kit.upload().single("banner_picture"), async (req, res) => {
    try {
        let { id, recommend_goods_info, } = req.body || {};
        const { filename, } = req.file || {};
        if(!id) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000024`,
                msg: 'id不能为空!',
            });
        }

        try {
            recommend_goods_info = JSON.parse(recommend_goods_info || '{}');
        } catch (error) {
            recommend_goods_info = {};
        }

        if(!recommend_goods_info || !Object.keys(recommend_goods_info).length) {
            return res.status(400).send({
                code: `DM-${ ROUTER_Flag }-000025`,
                msg: 'recommend_goods_info不能为空!',
            });
        }

        const banner_picture_old = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                "SELECT banner_picture FROM dm_goods WHERE id=?", 
                [id],
                (err, data) => !err ? resolve(data?.[0]?.banner_picture || null) : reject(err),
            )
        });

        const time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        recommend_goods_info = {
            ...recommend_goods_info,
            update_time: time,
            banner_picture: filename || null,
        };

        let sql = "";
        const params = [];
        Object.entries(recommend_goods_info).forEach(([key, value], index, arr) => {
            sql += `${ key }=?${ index < arr.length - 1 ? ", " : "" }`;
            params.push(value ?? null);
        });

        const result = await new Promise((resolve, reject) => {
            req?.pool?.query?.(
                `UPDATE dm_goods SET ${ sql } WHERE id=?`, 
                [...params, id],
                (err, data) => !err ? resolve(data) : reject(err),
            )
        });

        if(!result?.affectedRows) {
            return res.status(404).send({
                code: `DM-${ ROUTER_Flag }-000026`,
                msg: "推广失败!",
            });
        }
        
        if(banner_picture_old || recommend_goods_info?.banner_status === 0) {
            const pathname = path.join(__dirname, "..", "..", '.', `${ config.BANNER_PATH }/${ banner_picture_old }`);
            fsExtra.remove(pathname);
        }
        
        res.status(200).send({
            code: "DM-000000",
            msg: "推广成功!",
        });
    } catch (error) {
        res.status(500).send({
            code: `DM-${ ROUTER_Flag }-000023`,
            msg: '操作失败!',
            error,
            errorMsg: error?.message,
        });
    }
});

module.exports = router;