const express = require('express');
const router = express.Router();
const fs = require('fs');
const moment = require('moment');
const kit = require('./../kit');    
const config = require('./../config');
const lodash = require('lodash');

// multer上传图片相关设置
const multer  = require('multer');
const dest = 'public/img/products';
let upload = multer() // 文件储存路径

// 路由器标识
const ROUTER_Flag = "ADMIN_GOODS_LIST";

// 删除商品
router.delete('/delete/:id', (req, res) => {
    let { id } = req.params || {};
    if( !id ){
        return res.status(400).send({
            code: 1,
            msg: 'id不能为空'
        });
    }
    let sql = "DELETE FROM dm_products WHERE id=?";
    req?.pool?.query?.(sql, [id], (err, data) => {
        if( err ) throw err;
        if( data.affectedRows ){
            res.send({
                code: "DM-000000",
                data: null,
                msg: '删除商品成功'
            })
        }else{
            res.send({
                code: 5,
                msg: '删除商品失败'
            })
        }
    })
})

// 修改商品
router.put('/update', upload.any(), (req, res) => {
    let { id, inputData, delList=[], delDetailsList=[], delBannerList=[] } = req.body || {};
    inputData = JSON.parse(inputData);
    // delList = JSON.parse(delList);
    // delDetailsList = JSON.parse(delDetailsList);
    // delBannerList = JSON.parse(delBannerList);
    // let delArr = [...delList, ...delDetailsList, ...delBannerList];
    const files = req.files || [];
    const rbody = req.body || {};

    if( !id ){
        res.status(400).send({
            code: 1,
            msg: 'id不能为空'
        })
        return;
    }

    (async () => {
        let picList = [], picDetailsList = [], bannerList = [];
        // 存储商品图片的文件夹路径
        // let dirPath;
        // let dirPath02;
        // const timer = Date.now();
        // for(let r in rbody){
        //     r.startsWith('pImg') && picList.push(rbody[r]);
        //     r.startsWith('pDetailsImg') && picDetailsList.push(rbody[r]);
        //     r.startsWith('bannerImg') && bannerList.push(rbody[r]);
        // }
        // await new Promise((resolve, reject) => {
        //     if( files.length ){
        //         files.forEach((item, index) => {
        //             let { buffer, fieldname } = item;
        //             const encryptionName = require('crypto').createHash('md5').update(`productImg-${timer+index}`).digest('hex');
        //             if( buffer ){
        //                 if( fieldname.startsWith('pDetailsImg') ){
        //                     dirPath = `${dest}/details`
        //                     dirPath02 = `img/products/details`;
        //                 }else if( fieldname.startsWith('pImg') ){
        //                     dirPath = `${dest}/imgs`
        //                     dirPath02 = `img/products/imgs`;
        //                 }else if( fieldname.startsWith('bannerImg') ){
        //                     dirPath = `${dest}/banners`
        //                     dirPath02 = `img/products/banners`;
        //                 }
        //                 fs.writeFile(`${ dirPath }/${ encryptionName }.jpg`, buffer, err => {
        //                     if( err ){
        //                         throw err;
        //                     }else{
        //                         resolve();
        //                     }
        //                 })
        //                 if( fieldname.startsWith('pDetailsImg') ){
        //                     picDetailsList.push(`${dirPath02}/${ encryptionName }.jpg`);
        //                 }else if( fieldname.startsWith('pImg') ){
        //                     picList.push(`${dirPath02}/${ encryptionName }.jpg`);
        //                 }else if( fieldname.startsWith('bannerImg') ){
        //                     bannerList.push(`${dirPath02}/${ encryptionName }.jpg`);
        //                 }
        //             }
        //         })
        //     }else{
        //         resolve();
        //     }
        // })

        // let [ mainPicture, ...pictures ] = picList;
        // pictures = pictures.join('|');
        // let detailsPic = picDetailsList.join('|');
        // let [ bannerPic ] = bannerList;

        let { 
            brandId, productName, description, copywriting, price, spec, weight, placeOfOrigin, systems, cpu, thickness, disk, standbyTime, series, bareWeight, screenSize, gpu, characteristic, memory, gpuCapacity, bodyMaterial, hot, single, banner
        } = inputData;
    
        let params = [
            brandId, productName, description, copywriting, price, spec, weight, placeOfOrigin, systems, cpu, thickness, disk, standbyTime, series, bareWeight, screenSize, gpu, characteristic, memory, gpuCapacity, bodyMaterial, hot, single, banner, id
        ];
        let keys = [
            'brandId', 'productName', 'description', 'copywriting', 'price', 'spec', 'weight', 'placeOfOrigin', 'systems', 'cpu', 'thickness', 'disk', 'standbyTime', 'series', 'bareWeight', 'screenSize', 'gpu', 'characteristic', 'memory', 'gpuCapacity', 'bodyMaterial', 'hot', 'single', 'banner'
        ];
    
        let sql = 'UPDATE dm_products SET ';
        for(let p=0; p<keys.length; p++){
            if( p == keys.length -1 ){
                sql += `${keys[p]}=?`;
            }else{
                sql += `${keys[p]}=?, `; 
            }
        }
        sql += ' WHERE id=?';
        await new Promise((resolve, reject) => {
            req?.pool?.query?.(sql, params, (err, data) => {
                if( err ){
                    throw err;
                }else{
                    if( data.affectedRows ){
                        // delArr.forEach(item => {
                        //     fs.exists(`public/${item}`, exists => {
                        //         if( exists ){
                        //             fs.unlink(`public/${item}`, (err) => {
                        //                 if( err ) throw err;
                        //             });
                        //         }
                        //     });
                        // })
                        res.send({
                            code: "DM-000000",
                            data: null,
                            msg: '修改商品成功'
                        })
                    }else{
                        res.send({
                            code: 2,
                            msg: '修改商品失败'
                        })
                    }
                }
            })
        })
    })()
})

// 添加商品
router.post('/add', upload.any(), (req, res) => {
    let { inputData } = req.body || {};
    inputData = JSON.parse(inputData);
    // const files = req.files || [];
    // let paths = [`${dest}/details`, `${dest}/imgs`, `${dest}/banners`];
    if( !Object.keys(inputData).length ){
        res.status(400).send({
            code: 1,
            msg: 'inputData不能为空'
        })
        return;
    }

    // for(let p of paths){
    //     fs.exists(p, exists => {
    //         if( !exists ){
    //             fs.mkdir(p, err => {
    //                 if( err ) throw err;
    //             })
    //         }
    //     })
    // }
    
    (async () => {
        let mainPicture = null;
        pictures = null;
        detailsPic = null;
        bannerPic = null;
        // 存储商品图片的文件夹路径
        let dirPath;
        let dirPath02;
        const timer = Date.now();
        // await new Promise((resolve, reject) => {
        //     files.forEach((item, index) => {
        //         let { buffer, fieldname } = item;
        //         const encryptionName = require('crypto').createHash('md5').update(`productImg-${timer+index}`).digest('hex');
        //         if( fieldname.startsWith('pDetailsImg') ){
        //             dirPath = `${dest}/details`
        //             dirPath02 = `img/products/details`;
        //             detailsPic = `${ dirPath02 }/${ encryptionName }.jpg`;
        //         }else if( fieldname.startsWith('pImg') ){
        //             dirPath = `${dest}/imgs`
        //             dirPath02 = `img/products/imgs`;
        //             if( index == 0 ){
        //                 mainPicture = `${ dirPath02 }/${ encryptionName }.jpg`;
        //             }else{
        //                 pictures += `${ dirPath02 }/${ encryptionName }.jpg`;
        //                 if( index == files.length -1 ){
        //                     pictures +=  '';
        //                 }else{
        //                     pictures +=  '|';
        //                 }
        //             }
        //         }else if( fieldname.startsWith('bannerImg') ){
        //             dirPath = `${dest}/banners`
        //             dirPath02 = `img/products/banners`;
        //             bannerPic = `${ dirPath02 }/${ encryptionName }.jpg`;
        //         }
        //         if( buffer ){
        //             fs.writeFile(`${ dirPath }/${ encryptionName }.jpg`, buffer, err => {
        //                 if( err ){
        //                     throw err;
        //                 }else{
        //                     resolve();
        //                 }
        //             })
        //         }
        //     })
        // })

        let { 
            brandId, productName, description, copywriting, price, spec, weight, placeOfOrigin, systems, cpu, thickness, disk, standbyTime, series, bareWeight, screenSize, gpu, characteristic, memory, gpuCapacity, bodyMaterial, onLine=10, hot, single, banner
        } = inputData;

        let params = [
            brandId, productName, description, copywriting, price, spec, weight, placeOfOrigin, systems, cpu, thickness, disk, standbyTime, series, bareWeight, screenSize, gpu, characteristic, memory, gpuCapacity, bodyMaterial, mainPicture, pictures, detailsPic, onLine, hot, single, banner, bannerPic
        ];

        let sql = 'INSERT INTO dm_products VALUES (NULL, ';
        for(let p=0; p<params.length; p++){
            if( p == params.length -1 ){
                sql += `?, NULL, NULL)`;
            }else{
                sql += `?, `; 
            }
        }

        req?.pool?.query?.(sql, params, (err, data) => {
            if( err ){
                throw err;
            }else{
                if( data.affectedRows ){
                    res.send({
                        code: "DM-000000",
                        data: null,
                        msg: '添加商品成功'
                    })
                }else{
                    res.send({
                        code: 3,
                        msg: '添加商品失败'
                    })
                }
            }
        })
    })()
})

// 下载商品图片
router.get('/download', (req, res) => {
    let { url } = req.query || {};
    if( !url ){
        res.status(400).send({
          code: 1,
          msg: 'url不能为空！'
        })
        return;
    }
    const imgPath = `public/${url}`;
    fs.exists(imgPath, exists => {
        if( exists ){ 
            exists && res.download( imgPath );          
        }else{
            res.send({
              code: 2,
              msg: '服务器没有存储当前图片，下载失败！'
            })
        }
    });
})

// 上架 / 下架
router.post('/push', (req, res) => {
    const { id, code } = req.body || {};
    if( !id ){
        res.status(400).send({
            code: 1,
            msg: 'id不能为空！'
        })
        return;
    }
    if( !code ){
        res.status(400).send({
            code: 2,
            msg: 'code不能为空！'
        })
        return;
    }
    let msg01, msg02, params=null;
    if( code == 100 ){
        msg01 = '下架成功！';
        msg02 = '下架失败！';
        params = [10, id];
    }else if( code == 10 ){
        msg01 = '上架成功！';
        msg02 = '上架失败！';
        params = [100, id];
    }
    let sql = 'UPDATE dm_products SET onLine=? WHERE id=?';
    req?.pool?.query?.(sql, params, (err, data) => {
        if( err ){
            throw err;
        }else{
            if( data.affectedRows ){
                res.send({
                    code: "DM-000000",
                    data: null,
                    msg: msg01
                })
            }else{
                res.send({
                    code: 3,
                    msg: msg02
                })
            }
        }
    })
})

/**
 * 查询 - 商品pid
 */
router.get('/select/pid', (req, res) => {
    const sql = 'SELECT id FROM dm_products';
    req?.pool?.query?.(sql, null, (err, data) => {
        if(err){                    
            return res.status(503).send({
                code: 2,
                msg: err
            })
        }

        res.send({
            code: "DM-000000",
            data: data?.map?.(item => item?.id) || [],
        });
    });
});

module.exports = router;