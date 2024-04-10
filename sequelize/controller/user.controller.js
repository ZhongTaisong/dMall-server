const db = require("./../model/index");
const kit = require('./../../kit');
const model_name = "user";
const Model = db[model_name];
const Op = db.Sequelize.Op;

/** 判断 - 字段是否已存在 */
const isExistFn = kit.isExistFn(Model);

/**
 * 注册用户
 * @param {*} req
 * @param {*} res
 * @returns 
 */
exports.create = async (req, res) => {
    try {
        const { user_info, } = req.body || {};
        const { filename, path, } = req.file || {};
        
        let userInfo = {};
        if(typeof user_info === 'string' && user_info) {
          try {
            userInfo = JSON.parse(user_info);
          } catch (error) {
            userInfo = {};
          }
        }
        console.log('111111111111111111', user_info, req.file);

        if(filename) {
          Object.assign(userInfo, {
            avatar: filename,
          });
        }

        if(!userInfo || !Object.keys(userInfo).length) {
          kit.fsUnlinkFn(path);
          return res.status(400).send(kit.setResponseDataFormat("USER-CREATE-000001")()("缺少必要参数"));
        }

        const { phone, password, nickname, avatar, } = userInfo;
        const bol = await isExistFn({ phone, });
        if(bol) {
          kit.fsUnlinkFn(path);
          return res.status(200).send(kit.setResponseDataFormat("USER-CREATE-000005")()("手机号码已被注册"));
        }
      
        Model.create({ phone, password, nickname, avatar, }).then(data => {
          const result = data.toJSON();
          kit.batchDeleteObjKeyFn(result)(["password",]);
          res.status(200).send(kit.setResponseDataFormat()(result)());

        }).catch(err => {
          kit.fsUnlinkFn(path);
          res.status(500).send(kit.setResponseDataFormat("USER-CREATE-000002")()(err.message));
        });
    } catch (error) {
        kit.fsUnlinkFn(path);
        res.status(500).send(kit.setResponseDataFormat("USER-CREATE-000003")()(error.message));
    }
};

/**
 * 登录用户
 * @param {*} req
 * @param {*} res
 * @returns 
 */
exports.login = async (req, res) => {
  try {
    const body = req.body || {};
    if(!body || !Object.keys(body).length) {
      return res.status(400).send(kit.setResponseDataFormat("USER-LOGIN-000001")()("缺少必要参数"));
    }

    const { phone, password, } = body;
    if(!phone || !password) {
      return res.status(400).send(kit.setResponseDataFormat("USER-LOGIN-000005")()("缺少用户名或密码"));
    }

    const pwd = kit.md5(`${ phone }${ password }`);
    const result = await Model.findOne({ 
      where: { phone, password: pwd, },
      attributes: { exclude: ['password'] },
    });

    const user_info = result ? result.toJSON() : {};
    if(!user_info || !Object.keys(user_info).length) {
      return res.status(200).send(kit.setResponseDataFormat("USER-LOGIN-000003")()("用户名或密码错误"));
    }

    const token = kit.getTokenFn({ phone, });
    Object.assign(user_info, { token, });
  
    res.status(200).send(kit.setResponseDataFormat()(user_info)("登录成功"));
    
  } catch (error) {
      res.status(500).send(kit.setResponseDataFormat("USER-LOGIN-000002")()(error.message));
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
    let { phone, nickname, id, pageNum, pageSize, } = req.body || {};
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
      attributes: { exclude: ['password'] },
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
      res.status(500).send(kit.setResponseDataFormat("USER-FINDALL-000002")()(err.message));
    });
  } catch (error) {
    res.status(500).send(kit.setResponseDataFormat("USER-FINDALL-000001")()(error.message));
  }
};
