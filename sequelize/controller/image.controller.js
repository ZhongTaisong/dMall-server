const db = require("./../model/index");
const kit = require('./../../kit');
const path = require('path');
const config = require('./../../config');
const model_name = "image";
const Model = db[model_name];

/**
 * 新增上传图片
 * @param {*} req
 * @param {*} res
 * @returns 
 */
exports.create = async (req, res) => {
  const send = kit.createSendContentFn(req, res);
  const path_name = req?.path;
  const image_save_path = {
    "/upload/user": config.USER_PATH,
    "/upload/goods": config.GOODS_PATH,
  }[path_name];
  if(!image_save_path) {
    return send({
      code: "IMAGE-CREATE-000002",
      message: "图片存储路径异常",
    });
  }
  
  try {
    const promise_list = req.files.map(file => {
      const url = `${ config?.REQUEST_URL }${ image_save_path }/${ path.basename(file.path) }`;
      return Model.create({ url, });
    });
    const list = await Promise.all(promise_list);

    send({
      code: config.SUCCESS_CODE,
      context: list?.map?.(item => item?.url)?.filter?.(Boolean) || [],
      message: "图片上传成功",
    });
  } catch (error) {
    send({
      code: "IMAGE-CREATE-000001",
      error,
    });
  }
};
