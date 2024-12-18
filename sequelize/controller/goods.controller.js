const db = require("./../model/index");
const kit = require('./../../kit');
const config = require('./../../config');
const model_name = "goods";
const Model = db[model_name];
const ImageModel = db["image"];
const Op = db.Sequelize.Op;

/** 判断 - 字段是否已存在 */
const isExistFn = kit.isExistFn(Model);

/**
 * 新增商品
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
        code: "GOODS-CREATE-000002",
        message: "参数不正确",
      });
    }

    const { goods_name, goods_subtitle, goods_price, goods_imgs, } = body;
    if(!Array.isArray(goods_imgs) || !goods_imgs.length) {
      return send({
        code: "GOODS-CREATE-000003",
        message: "参数不正确",
      });
    }

    const bol = await isExistFn({ goods_name, });
    if(bol) {
      return send({
        code: "GOODS-CREATE-000004",
        message: "商品名称已被使用",
      });
    }

    const image_list = await ImageModel.findAll({ where: { url: goods_imgs }, });
    if(!Array.isArray(image_list) || image_list?.length !== goods_imgs?.length) {
      return send({
        code: "GOODS-CREATE-000005",
        message: "图片查询异常",
      });
    }

    const result = await Model.create({ 
      goods_name, 
      goods_subtitle, 
      goods_price, 
      goods_imgs: goods_imgs.join("|"), 
    });
    await Promise.all(image_list.map(item => item.update({ used: true, })));

    send({
      code: config.SUCCESS_CODE,
      context: result?.toJSON?.() || {},
      message: "新增成功",
    });
  } catch (error) {
    send({
      code: "GOODS-CREATE-000001",
      error,
    });
  }
};

/**
 * 删除指定商品
 * @param {*} req 
 * @param {*} res 
 */
exports.delete = async (req, res) => {
  const send = kit.createSendContentFn(res);

  try {
    const params = req.params || {};
    if(!params || !Object.keys(params).length) {
      return send({
        code: "GOODS-DELETE-000002",
        message: "参数不正确",
      });
    }

    const { id, } = params;
    if(!id) {
      return send({
        code: "GOODS-DELETE-000003",
        message: "参数不正确",
      });
    }

    const info = await Model.findByPk(id);
    if(!info) {
      return send({
        code: "GOODS-DELETE-000004",
        message: "商品信息查询异常",
      });
    }

    const delete_imgs = info?.goods_imgs ? info?.goods_imgs?.split?.('|') : [];
    const image_list = await ImageModel.findAll({ where: { url: delete_imgs }, });
    if(!Array.isArray(image_list)) {
      return send({
        code: "GOODS-DELETE-000005",
        message: "图片查询异常",
      });
    }

    const result = await Model.destroy({
      where: {...params},
    });

    await Promise.all(image_list.map(item => item.update({ used: false, })));

    send({
      code: result === 1 ? config.SUCCESS_CODE : "GOODS-DELETE-000006",
      message: result === 1 ? "删除成功" : "删除失败",
    });
  } catch (error) {
    send({
      code: "GOODS-DELETE-000001",
      error,
    });
  }
};

/**
 * 更新指定商品
 * @param {*} req 
 * @param {*} res 
 */
exports.update = async (req, res) => {
  const send = kit.createSendContentFn(res);

  try {
    const body = req.body || {};
    if(!body || !Object.keys(body).length) {
      return send({
        code: "GOODS-UPDATE-000002",
        message: "参数不正确",
      });
    }

    const { 
      id, goods_imgs,
      goods_name, goods_subtitle, goods_price,
    } = body || {};
    if(!id || !goods_name || !goods_subtitle || !goods_price) {
      return send({
        code: "GOODS-UPDATE-000003",
        message: "参数不正确",
      });
    }

    if(!Array.isArray(goods_imgs) || !goods_imgs.length) {
      return send({
        code: "GOODS-UPDATE-000004",
        message: "参数不正确",
      });
    }

    const info = await isExistFn({ goods_name, });
    if(info && info?.id !== id) {
      return send({
        code: "GOODS-UPDATE-000005",
        message: "商品名称已被使用",
      });
    }

    const goods_info = await Model.findByPk(id);
    if(!goods_info) {
      return send({
        code: "GOODS-UPDATE-000006",
        message: "商品信息查询异常",
      });
    }

    const current_goods_imgs = goods_info?.goods_imgs ? goods_info?.goods_imgs?.split?.('|') : [];
    const new_goods_imgs = goods_imgs;
    const imgs = [...current_goods_imgs, ...new_goods_imgs];
    const image_list = await ImageModel.findAll({ where: { url: imgs, }, });
    if(!Array.isArray(image_list)) {
      return send({
        code: "GOODS-UPDATE-000007",
        message: "图片查询异常",
      });
    }

    const [result] = await Model.update({
      goods_name, goods_subtitle, goods_price,
      goods_imgs: new_goods_imgs.join("|"),
    }, {
      where: { id, },
    });

    await Promise.all(image_list.map(item => item.update({ used: new_goods_imgs.includes(item?.url), })));
    
    send({
      code: result === 1 ? config.SUCCESS_CODE : "GOODS-UPDATE-000008",
      message: result === 1 ? "更新成功" : "更新失败",
    });
  } catch (error) {
    send({
      code: "GOODS-UPDATE-000001",
      error,
    });
  }
};

/**
 * 根据筛选条件查询商品
 * @param {*} req 
 * @param {*} res 
 */
exports.list = async (req, res) => {
  const send = kit.createSendContentFn(res);

  try {
    const { goods_name, id, pageNum, pageSize, } = req.body || {};
    const page_num = pageNum ?? 0;
    const page_size = pageSize ?? 10;

    const params = {};
    if(id) {
      Object.assign(params, {
        id,
      });
    }

    const Op_and_list = [];
    if(goods_name) {
      Op_and_list.push({
        goods_name: { [Op.like]: `%${goods_name}%` },
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

    const rows = result?.rows?.map?.(item => item?.get?.({ plain: true, }))?.filter?.(Boolean) || [];
    const total = result?.count ?? 0;
    const content = rows.map(item => {
      if(!item || !Object.keys(item).length) return;

      const img_list = String(item['goods_imgs'] || "").split("|");
      Object.assign(item, {
        createdAt: kit.dateToStringFn(item['createdAt']),
        updatedAt: kit.dateToStringFn(item['updatedAt']),
        goods_imgs: img_list,
      });

      return item;
    }).filter(Boolean);
    
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
      code: "GOODS-LIST-000001",
      error,
    });
  }
};
