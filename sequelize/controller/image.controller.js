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

/**
 * 删除指定数据
 * @param {*} req 
 * @param {*} res 
 */
exports.delete = async (req, res) => {
  const send = kit.createSendContentFn(req, res);

  try {
    const params = req.params || {};
    if(!params || !Object.keys(params).length) {
      return send({
        code: "IMAGE-DELETE-000002",
        message: "参数不正确",
      });
    }

    const result = await Model.destroy({
      where: {...params},
    });
    if(result !== 1) {
      return send({
        code: "IMAGE-DELETE-000003",
        message: "删除失败",
      });
    }

    send({
      code: config.SUCCESS_CODE,
      message: "删除成功",
    });
  } catch (error) {
    send({
      code: "IMAGE-DELETE-000001",
      error,
    });
  }
};

/**
 * 根据筛选条件查询 - 分页
 * @param {*} req 
 * @param {*} res 
 */
exports.list = async (req, res) => {
  const send = kit.createSendContentFn(req, res);

  try {
    const { pageNum, pageSize, } = req.body || {};
    const page_num = pageNum ?? 0;
    const page_size = pageSize ?? 10;

    const result = await Model.findAndCountAll({ 
      order: [
        ['createdAt', 'DESC'],
      ],
      offset: page_num * page_size,
      limit: page_size,
    });

    const rows = Array.isArray(result?.rows) ? result?.rows : [];
    const content = rows.map(item => {
      const item_js = item.toJSON();
      if(!item_js || !Object.keys(item_js).length) return;

      Object.assign(item_js, {
        createdAt: kit.dateToStringFn(item_js['createdAt']),
        updatedAt: kit.dateToStringFn(item_js['updatedAt']),
      })
      return item_js;
    }).filter(Boolean);

    const total = result?.count ?? 0;
    send({
      code: config.SUCCESS_CODE,
      context: {
        pageNum: page_num,
        pageSize: page_size,
        total,
        totalPages: Math.ceil(total / page_size),
        content,
        actions: kit.getRoleActionsFn(kit.getUserInfoFn(req)?.role),
      },
    });
  } catch (error) {
    send({
      code: "IMAGE-LIST-000001",
      error,
    });
  }
};

/**
 * 根据筛选条件查询 - 全部
 * @param {*} req 
 * @param {*} res 
 */
exports.listAll = async (req, res) => {
  const send = kit.createSendContentFn(req, res);

  try {
    const result = await Model.findAndCountAll({ 
      order: [
        ['createdAt', 'DESC'],
      ],
    });

    const rows = Array.isArray(result?.rows) ? result?.rows : [];
    const content = rows.map(item => {
      const item_js = item.toJSON();
      if(!item_js || !Object.keys(item_js).length) return;

      Object.assign(item_js, {
        createdAt: kit.dateToStringFn(item_js['createdAt']),
        updatedAt: kit.dateToStringFn(item_js['updatedAt']),
      })
      return item_js;
    }).filter(Boolean);

    const total = result?.count ?? 0;
    send({
      code: config.SUCCESS_CODE,
      context: {
        total,
        content,
        actions: kit.getRoleActionsFn(kit.getUserInfoFn(req)?.role),
      },
    });
  } catch (error) {
    send({
      code: "IMAGE-LIST-ALL-000001",
      error,
    });
  }
};
