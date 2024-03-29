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
          return res.status(400).send(kit.setResponseDataFormat("USER000001")()("缺少必要参数"));
        }
      
        Model.create(body).then(data => {
          const result = data.toJSON();
          delete result['password'];
          res.status(200).send(kit.setResponseDataFormat()(result)());
        }).catch(err => {
          res.status(500).send(kit.setResponseDataFormat("USER000002")()(err.message));
        });
    } catch (error) {
        res.status(500).send(kit.setResponseDataFormat("USER000003")()(error.message));
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
            res.status(500).send(kit.setResponseDataFormat("USER000006")()(err.message));
        });
    } catch (error) {
        res.status(500).send(kit.setResponseDataFormat("USER000005")()(error.message));
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
          return res.status(400).send(kit.setResponseDataFormat("USER000008")()("缺少必要参数"));
        }

        const { id, ...rest } = body;
        if(!id) {
          return res.status(400).send(kit.setResponseDataFormat("USER000010")()("id不能为空"));
        }

        Model.update(rest, {
          where: { id, },
        }).then(() => {
            res.status(200).send(kit.setResponseDataFormat()()("更新成功"));
        }).catch(err => {
            res.status(500).send(kit.setResponseDataFormat("USER000009")()(err.message));
        });
    } catch (error) {
        res.status(500).send(kit.setResponseDataFormat("USER000007")()(error.message));
    }
};



// 从数据库中搜索.
exports.findAll = (req, res) => {
  const title = req.query.title;
  var condition = title ? { title: { [Op.like]: `%${title}%` } } : null;

  Todo.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "搜索时，发生错误。"
      });
    });
};

// 按照条目 ID 搜索
exports.findOne = (req, res) => {
  const id = req.params.id;

  Todo.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `没有找到 ${id} 的清单`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message:  `查询第 ${id} 条清单时出错`
      });
    });
};

// 检查所有清单状态
exports.findAllstauts = (req, res) => {
  Todo.findAll({ where: { stauts: true } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "搜索清单时出错"
      });
    });
};
