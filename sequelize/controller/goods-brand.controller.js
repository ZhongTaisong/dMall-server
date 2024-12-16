const db = require("./../model/index");
const kit = require('./../../kit');
const config = require('./../../config');
const model_name = "goods_brand";
const Model = db[model_name];
const Op = db.Sequelize.Op;

/** 判断 - 字段是否已存在 */
const isExistFn = kit.isExistFn(Model);

/**
 * 新增品牌
 * @param {*} req
 * @param {*} res
 * @returns 
 */
exports.create = async (req, res) => {
  const send = kit.createSendContentFn(res);

  try {
    const body = req.body || {};
    if(!body || !Object.keys(body).length) {
      return send({
        code: "GOODS-BRAND-CREATE-000001",
        message: "参数不正确",
      });
    }

    const { brand_name, } = body;
    const bol = await isExistFn({ brand_name, });
    if(bol) {
      return send({
        code: "GOODS-BRAND-CREATE-000002",
        message: "品牌名称已存在",
      });
    }
  
    await Model.create({ brand_name, });
    send({
      code: config.SUCCESS_CODE,
      message: "新增成功",
    });

  } catch (error) {
    send({
      code: "GOODS-BRAND-CREATE-000003",
      error,
    });
  }
};

/**
 * 删除指定品牌
 * @param {*} req 
 * @param {*} res 
 */
exports.delete = async (req, res) => {
  const send = kit.createSendContentFn(res);

  try {
    const params = req.params || {};
    if(!params || !Object.keys(params).length) {
      return send({
        code: "GOODS-BRAND-DELETE-000002",
        message: "参数不正确",
      });
    }

    const result = await Model.destroy({
      where: {...params},
    });

    send({
      code: result === 1 ? config.SUCCESS_CODE : "GOODS-BRAND-DELETE-000003",
      message: result === 1 ? "删除成功" : "删除失败",
    });

  } catch (error) {
    send({
      code: "GOODS-BRAND-DELETE-000001",
      error,
    });
  }
};

/**
 * 更新指定品牌
 * @param {*} req 
 * @param {*} res 
 */
exports.update = async (req, res) => {
  const send = kit.createSendContentFn(res);

  try {
    const body = req.body || {};
    if(!body || !Object.keys(body).length) {
      return send({
        code: "GOODS-BRAND-UPDATE-000002",
        message: "参数不正确",
      });
    }

    const { id, brand_name, } = body;
    if(!id) {
      return send({
        code: "GOODS-BRAND-UPDATE-000003",
        message: "参数不正确",
      });
    }

    const bol = await isExistFn({ brand_name, });
    if(bol) {
      return send({
        code: "GOODS-BRAND-UPDATE-000004",
        message: "品牌名称已存在",
      });
    }

    const [result] = await Model.update({ brand_name, }, {
      where: { id, },
      // 只保存这几个字段到数据库中
      fields: ['brand_name',],
    });
    
    send({
      code: result === 1 ? config.SUCCESS_CODE : "GOODS-BRAND-UPDATE-000005",
      message: result === 1 ? "更新成功" : "更新失败",
    });
  } catch (error) {
    send({
      code: "GOODS-BRAND-UPDATE-000001",
      error,
    });
  }
};

/**
 * 根据筛选条件查询品牌
 * @param {*} req 
 * @param {*} res 
 */
exports.list = async (req, res) => {
  const send = kit.createSendContentFn(res);

  try {
    const { brand_name, id, pageNum, pageSize, } = req.body || {};
    const page_num = pageNum ?? 0;
    const page_size = pageSize ?? 10;

    const params = {};
    if(id) {
      Object.assign(params, {
        id,
      });
    }

    const Op_and_list = [];
    if(brand_name) {
      Op_and_list.push({
        brand_name: { [Op.like]: `%${brand_name}%` },
      });
    }

    if(Op_and_list.length) {
      Object.assign(params, {
        [Op.and]: Op_and_list,
      });
    }

    const result = await Model.findAndCountAll({ 
      where: params,
      order: [
        ['updatedAt', 'DESC'],
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
      },
    });
  } catch (error) {
    send({
      code: "GOODS-BRAND-LIST-000001",
      error,
    });
  }
};
