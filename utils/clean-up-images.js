const db = require("./../sequelize/model/index");
const config = require("./../config/index");
const kit = require("./../kit");
const Model = db["image"];
const fs = require("fs");
const path = require('path');

const cleanUpImages = async () => {
  const unusedImages = await Model.findAll({
    where: { used: false, },
  });

  if(!Array.isArray(unusedImages) || !unusedImages.length) {
    return kit.createLogContentFn({
      path: "cleanUpImages",
      msg: "清理成功",
    });
  }

  const promise_list = [];
  unusedImages.forEach(item => {
    if(item && Object.keys(item).length) {
      const file_name = path.basename(item?.url);
      if(file_name) {
        const file_path = path.join(__dirname, ".." ,`${ config.GOODS_PATH }/${ file_name }`);
        try {
          fs.unlinkSync(file_path); 
          kit.createLogContentFn({
            path: "cleanUpImages",
            msg: "删除图片文件成功",
          });
        } catch (error) {
          kit.createLogContentFn({
            path: "cleanUpImages",
            msg: "删除图片文件失败",
            error,
          });
        }
        promise_list.push(item.destroy()); 
      }
    }
  });

  if(promise_list.length) {
    Promise.all(promise_list).then(res => {
      kit.createLogContentFn({
        path: "cleanUpImages",
        msg: "删除图片数据成功",
      });
    }).catch(error => {
      kit.createLogContentFn({
        path: "cleanUpImages",
        msg: "删除图片数据失败",
        error,
      });
    })
  }

  // for(const image of unusedImages) {
  //   const file_name = path.basename(image?.url);
  //   if(file_name) {
  //     const file_path = path.join(__dirname, ".." ,`${ config.GOODS_PATH }/${ file_name }`);
  //     try {
  //       fs.unlinkSync(file_path);
  //       await image.destroy();
  //     } catch (error) {
  //       kit.createLogContentFn({
  //         path: "cleanUpImages",
  //         error,
  //       });
  //     }
  //   }
  // }
}

cleanUpImages();
