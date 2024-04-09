const db = require("./../model/index");
const kit = require('./../../kit');
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
  try {
    const body = req.body || {};
    if(!body || !Object.keys(body).length) {
      return res.status(400).send(kit.setResponseDataFormat("GOODS-BRAND-CREATE-000001")()("缺少必要参数"));
    }

    const { brand_name, } = body;
    const bol = await isExistFn({ brand_name, });
    if(bol) {
      return res.status(200).send(kit.setResponseDataFormat("GOODS-BRAND-CREATE-000005")()("品牌名称已存在"));
    }
  
    Model.create({ brand_name, }).then(data => {
      const result = data.toJSON();
      res.status(200).send(kit.setResponseDataFormat()(result)());
    }).catch(err => {
      res.status(500).send(kit.setResponseDataFormat("GOODS-BRAND-CREATE-000002")()(err.message));
    });
  } catch (error) {
    res.status(500).send(kit.setResponseDataFormat("GOODS-BRAND-CREATE-000003")()(error.message));
  }
};

/**
 * 删除指定品牌
 * @param {*} req 
 * @param {*} res 
 */
exports.delete = (req, res) => {
  try {
    const params = req.params || {};
    Model.destroy({
      where: params,
    }).then(() => {
      res.status(200).send(kit.setResponseDataFormat()()("删除成功"));
    }).catch(err => {
      res.status(500).send(kit.setResponseDataFormat("GOODS-BRAND-DELETE-000001")()(err.message));
    });
  } catch (error) {
    res.status(500).send(kit.setResponseDataFormat("GOODS-BRAND-DELETE-000002")()(error.message));
  }
};

/**
 * 更新指定品牌
 * @param {*} req 
 * @param {*} res 
 */
exports.update = async (req, res) => {
    try {
        const body = req.body || {};
        if(!body || !Object.keys(body).length) {
          return res.status(400).send(kit.setResponseDataFormat("GOODS-BRAND-UPDATE-000001")()("缺少必要参数"));
        }

        const { id, brand_name, } = body;
        if(!id) {
          return res.status(400).send(kit.setResponseDataFormat("GOODS-BRAND-UPDATE-000002")()("id不能为空"));
        }

        const bol = await isExistFn({ brand_name, });
        if(bol) {
          return res.status(200).send(kit.setResponseDataFormat("GOODS-BRAND-UPDATE-000006")()("品牌名称已存在"));
        }

        Model.update({ brand_name, }, {
          where: { id, },
          // 只保存这几个字段到数据库中
          fields: ['brand_name',],
        }).then(() => {
            res.status(200).send(kit.setResponseDataFormat()()("更新成功"));
        }).catch(err => {
            res.status(500).send(kit.setResponseDataFormat("GOODS-BRAND-UPDATE-000003")()(err.message));
        });
    } catch (error) {
        res.status(500).send(kit.setResponseDataFormat("GOODS-BRAND-UPDATE-000005")()(error.message));
    }
};

/**
 * 根据筛选条件查询品牌
 * @param {*} req 
 * @param {*} res 
 */
exports.findAll = (req, res) => {
  try {
    let { brand_name, id, pageNum, pageSize, } = req.body || {};
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

    const limit_params = {};
    if(typeof pageNum !== 'undefined' || typeof pageSize !== 'undefined') {
      // 跳过几个
      pageNum = typeof pageNum === 'number' && pageNum >= 0 ? pageNum : 0;
      // 每行限制几个
      pageSize = typeof pageSize === 'number' && pageSize >= 0 ? pageSize : 10;

      Object.assign(limit_params, {
        offset: pageNum * pageSize,
        limit: pageSize,
      });
    }

    Model.findAndCountAll({ 
      where: params,
      order: [
        ['updatedAt', 'DESC'],
      ],
      ...limit_params,
    }).then(data => {
      const rows = Array.isArray(data?.rows) ? data?.rows : []
      const result = rows.map(item => {
        const item_js = item.toJSON();
        if(!item_js || !Object.keys(item_js).length) return;

        Object.assign(item_js, {
          createdAt: kit.dateToStringFn(item_js['createdAt']),
          updatedAt: kit.dateToStringFn(item_js['updatedAt']),
        })
        return item_js;
      }).filter(Boolean);

      const content = {
        list: result,
        total: data?.count ?? 0,
      }
      if(limit_params && Object.keys(limit_params).length) {
        Object.assign(content, {
          pageNum,
          pageSize,
        });
      }
      res.status(200).send(kit.setResponseDataFormat()(content)());
    }).catch(err => {
      res.status(500).send(kit.setResponseDataFormat("GOODS-BRAND-FINDALL-000002")()(err.message));
    });
  } catch (error) {
    res.status(500).send(kit.setResponseDataFormat("GOODS-BRAND-FINDALL-000001")()(error.message));
  }
};
