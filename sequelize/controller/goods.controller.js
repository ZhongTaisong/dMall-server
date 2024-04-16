const db = require("./../model/index");
const kit = require('./../../kit');
const config = require('./../../config');
const model_name = "goods";
const Model = db[model_name];
const Op = db.Sequelize.Op;

/** 判断 - 字段是否已存在 */
const isExistFn = kit.isExistFn(Model);
/** 商品图片存储路径 */
const goods_path = config.GOODS_PATH;

/**
 * 新增商品 - FormData
 * @param {*} req
 * @param {*} res
 * @returns 
 */
exports.formData_create = async (req, res) => {
  const files = req?.files || [];
  const paths = files?.map?.(item => item?.path)?.filter?.(Boolean) || [];
  const filenames = files?.map?.(item => item?.filename)?.filter?.(Boolean) || [];

  try {
    const body = req.body || {};
    if(!body || !Object.keys(body).length) {
      kit.batchFsUnlinkFn(paths);
      return res.status(400).send(kit.setResponseDataFormat("GOODS-FORMDATA_CREATE-000003")()("缺少必要参数"));
    }

    if(Array.isArray(filenames) && filenames.length) {
      Object.assign(body, {
        goods_img: filenames.join("|"),
      });
    }

    const { goods_name, goods_description, goods_price, goods_detail, goods_img, } = body;
    const bol = await isExistFn({ goods_name, });
    if(bol) {
      kit.batchFsUnlinkFn(paths);
      return res.status(200).send(kit.setResponseDataFormat("GOODS-FORMDATA_CREATE-000005")()("商品名称已被使用"));
    }
  
    Model.create({ goods_name, goods_description, goods_price, goods_detail, goods_img, }).then(data => {
      const result = data.toJSON();
      res.status(200).send(kit.setResponseDataFormat()(result)());

    }).catch(err => {
      kit.batchFsUnlinkFn(paths);
      res.status(500).send(kit.setResponseDataFormat("GOODS-FORMDATA_CREATE-000002")()(err.message));
    });
  } catch (error) {
    kit.batchFsUnlinkFn(paths);
    res.status(500).send(kit.setResponseDataFormat("GOODS-FORMDATA_CREATE-000001")()(error.message));
  }
};

/**
 * 删除指定商品
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
            res.status(500).send(kit.setResponseDataFormat("GOODS-DELETE-000001")()(err.message));
        });
    } catch (error) {
        res.status(500).send(kit.setResponseDataFormat("GOODS-DELETE-000002")()(error.message));
    }
};

/**
 * 更新指定商品 - FormData
 * @param {*} req 
 * @param {*} res 
 */
exports.formData_update = async (req, res) => {
  const files = req?.files || [];
  let paths = files?.map?.(item => item?.path)?.filter?.(Boolean) || [];
  let filenames = files?.map?.(item => item?.filename)?.filter?.(Boolean) || [];

  try {
    const body = req.body || {};
    if(!body || !Object.keys(body).length) {
      kit.batchFsUnlinkFn(paths);
      return res.status(400).send(kit.setResponseDataFormat("GOODS-FORMDATA_UPDATE-000003")()("缺少必要参数"));
    }

    const goods_imgs = body?.goods_imgs || [];
    if(goods_imgs && typeof goods_imgs === 'string' && !Array.isArray(goods_imgs)) {
      filenames.push(goods_imgs?.split?.(`${ goods_path }/`)?.[1] || "");
    }

    if(Array.isArray(goods_imgs)) {
      goods_imgs.forEach(item => {
        filenames.push(item?.split?.(`${ goods_path }/`)?.[1] || "");
      })
    }

    if(Array.isArray(filenames)) {
      Object.assign(body, {
        goods_img: filenames.join("|"),
      });
    }

    const { id, goods_name, goods_description, goods_price, goods_detail, goods_img, } = body;
    if(!id) {
      kit.fsUnlinkFn(path);
      return res.status(400).send(kit.setResponseDataFormat("GOODS-FORMDATA_UPDATE-000005")()("id不能为空"));
    }

    const info = await isExistFn({ goods_name, });
    const { goods_img: goods_img_prev, goods_name: goods_name_prev, id: id_prev, } = info?.toJSON?.() || {};
    if(id && id_prev && id != id_prev) {
      if(goods_name && goods_name_prev && goods_name === goods_name_prev) {
        kit.batchFsUnlinkFn(paths);
        return res.status(200).send(kit.setResponseDataFormat("GOODS-FORMDATA_UPDATE-000006")()("商品名称已被使用"));
      }
    }

    Model.update({ goods_name, goods_description, goods_price, goods_detail, goods_img, }, {
      where: { id, },
    }).then(() => {
      const goods_img_new = goods_img;
      if(goods_img_new !== goods_img_prev && goods_img_prev) {
        const list = goods_img_prev?.split?.("|") || [];
        if(Array.isArray(list)) {
          paths = list.filter(item => !goods_img_new?.includes?.(item)).map(item => `${ process.cwd() }${ goods_path }/${ item }`);
          kit.batchFsUnlinkFn(paths);
        }
      }

      res.status(200).send(kit.setResponseDataFormat()()("更新成功"));
    }).catch(err => {
      kit.batchFsUnlinkFn(paths);
      res.status(500).send(kit.setResponseDataFormat("GOODS-FORMDATA_UPDATE-000002")()(err.message));
    });
  } catch (error) {
    kit.batchFsUnlinkFn(paths);
    res.status(500).send(kit.setResponseDataFormat("GOODS-FORMDATA_UPDATE-000001")()(error.message));
  }
};

/**
 * 根据筛选条件查询商品
 * @param {*} req 
 * @param {*} res 
 */
exports.findAll = (req, res) => {
  try {
    let { goods_name, id, pageNum, pageSize, } = req.body || {};
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

        const goodsImgs = String(item_js['goods_img'] || "").split("|");
        Object.assign(item_js, {
          createdAt: kit.dateToStringFn(item_js['createdAt']),
          updatedAt: kit.dateToStringFn(item_js['updatedAt']),
          goods_imgs: kit.batchJoinFullImgUrlFn("GOODS_PATH", goodsImgs),
        });

        delete item_js['goods_img'];
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
      res.status(500).send(kit.setResponseDataFormat("GOODS-FINDALL-000002")()(err.message));
    });
  } catch (error) {
    res.status(500).send(kit.setResponseDataFormat("GOODS-FINDALL-000001")()(error.message));
  }
};
