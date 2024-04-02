const db = require("./../model/index");
const kit = require('./../../kit');
const model_name = "user";
const Model = db[model_name];
const Op = db.Sequelize.Op;

/**
 * 注册用户
 * @param {*} req
 * @param {*} res
 * @returns 
 */
exports.create = (req, res) => {
    try {
        const body = req.body || {};
        if(!body || !Object.keys(body).length) {
          return res.status(400).send(kit.setResponseDataFormat("USER-CREATE-000001")()("缺少必要参数"));
        }

        kit.batchDeleteObjKeyFn(body)(["id", "createdAt", "updatedAt"]);
      
        Model.create(body).then(data => {
          const result = data.toJSON();
          kit.batchDeleteObjKeyFn(result)(["password",]);
          res.status(200).send(kit.setResponseDataFormat()(result)());
        }).catch(err => {
          res.status(500).send(kit.setResponseDataFormat("USER-CREATE-000002")()(err.message));
        });
    } catch (error) {
        res.status(500).send(kit.setResponseDataFormat("USER-CREATE-000003")()(error.message));
    }
};

/**
 * 删除指定用户
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
            res.status(500).send(kit.setResponseDataFormat("USER-DELETE-000001")()(err.message));
        });
    } catch (error) {
        res.status(500).send(kit.setResponseDataFormat("USER-DELETE-000002")()(error.message));
    }
};

/**
 * 更新指定用户
 * @param {*} req 
 * @param {*} res 
 */
exports.update = (req, res) => {
    try {
        const body = req.body || {};
        if(!body || !Object.keys(body).length) {
          return res.status(400).send(kit.setResponseDataFormat("USER-UPDATE-000001")()("缺少必要参数"));
        }

        const { id, ...rest } = body;
        if(!id) {
          return res.status(400).send(kit.setResponseDataFormat("USER-UPDATE-000002")()("id不能为空"));
        }

        Model.update(rest, {
          where: { id, },
          // 只保存这几个字段到数据库中
          fields: ['nickname', 'avatar'],
        }).then(() => {
            res.status(200).send(kit.setResponseDataFormat()()("更新成功"));
        }).catch(err => {
            res.status(500).send(kit.setResponseDataFormat("USER-UPDATE-000003")()(err.message));
        });
    } catch (error) {
        res.status(500).send(kit.setResponseDataFormat("USER-UPDATE-000005")()(error.message));
    }
};

/**
 * 根据筛选条件查询用户
 * @param {*} req 
 * @param {*} res 
 */
exports.findAll = (req, res) => {
  try {
    const { phone, nickname, id, } = req.body || {};
    const params = {};
    if(id) {
      Object.assign(params, {
        id,
      });
    }

    const Op_and_list = [];
    if(phone) {
      Op_and_list.push({
        phone: { [Op.like]: `%${phone}%` },
      });
    }

    if(nickname) {
      Op_and_list.push({
        nickname: { [Op.like]: `%${nickname}%` },
      });
    }

    if(Op_and_list.length) {
      Object.assign(params, {
        [Op.and]: Op_and_list,
      });
    }

    Model.findAll({ 
      where: params,
      attributes: { exclude: ['password'] },
    }).then(data => {
      data = Array.isArray(data) ? data : [];
      const result = data.map(item => item.toJSON());
      result.forEach(item => {
        kit.batchDeleteObjKeyFn(item)(["password",]);
      })
      res.status(200).send(kit.setResponseDataFormat()(result)());
    }).catch(err => {
      res.status(500).send(kit.setResponseDataFormat("USER-FINDALL-000002")()(err.message));
    });
  } catch (error) {
    res.status(500).send(kit.setResponseDataFormat("USER-FINDALL-000001")()(error.message));
  }
};
