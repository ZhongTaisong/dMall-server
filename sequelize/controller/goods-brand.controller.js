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

    kit.batchDeleteObjKeyFn(body)(["id", "createdAt", "updatedAt"]);

    const { brand_name, } = body;
    const bol = await isExistFn({ brand_name, });
    if(bol) {
      return res.status(200).send(kit.setResponseDataFormat("GOODS-BRAND-CREATE-000005")()("品牌名称已存在"));
    }
  
    Model.create(body).then(data => {
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

        const { id, ...rest } = body;
        if(!id) {
          return res.status(400).send(kit.setResponseDataFormat("GOODS-BRAND-UPDATE-000002")()("id不能为空"));
        }

        const { brand_name, } = body;
        const bol = await isExistFn({ brand_name, });
        if(bol) {
          return res.status(200).send(kit.setResponseDataFormat("GOODS-BRAND-UPDATE-000006")()("品牌名称已存在"));
        }

        Model.update(rest, {
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
    const { brand_name, id, } = req.body || {};
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

    Model.findAll({ 
      where: params,
    }).then(data => {
      data = Array.isArray(data) ? data : [];
      const result = data.map(item => item.toJSON());
      res.status(200).send(kit.setResponseDataFormat()(result)());
    }).catch(err => {
      res.status(500).send(kit.setResponseDataFormat("GOODS-BRAND-FINDALL-000002")()(err.message));
    });
  } catch (error) {
    res.status(500).send(kit.setResponseDataFormat("GOODS-BRAND-FINDALL-000001")()(error.message));
  }
};
