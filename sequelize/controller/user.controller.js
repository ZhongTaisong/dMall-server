const db = require("./../model/index");
const kit = require('./../../kit');
const config = require('./../../config');
const model_name = "user";
const Model = db[model_name];
const ImageModel = db["image"];
const Op = db.Sequelize.Op;
const md5 = require('js-md5');
const jwt = require('jsonwebtoken');

/** 判断 - 字段是否已存在 */
const isExistFn = kit.isExistFn(Model);

/**
 * 新增用户、注册用户
 * @param {*} req
 * @param {*} res
 * @returns 
 */
exports.create = async (req, res) => {
  const path_name = req?.path;
  const send = kit.createSendContentFn(req, res);

  try {
    const body = req.body || {};
    if(!body || !Object.keys(body).length) {
      return send({
        code: "USER-CREATE-000002",
        message: "参数不正确",
      });
    }

    const { phone, password, nickname, avatar, } = body;
    const role = body?.role || "2";
    if (!phone || !password || !role) {
      return send({
        code: "USER-CREATE-000003",
        message: "参数不正确",
      });
    }

    if(["/add"].includes(path_name)) {
      if (!nickname || !avatar) {
        return send({
          code: "USER-CREATE-000006",
          message: "参数不正确",
        });
      }
    }

    const bol = await isExistFn({ phone, });
    if(bol) {
      return send({
        code: "USER-CREATE-000004",
        message: "手机号已被注册",
      });
    }

    const params = {
      phone, 
      password: kit.md5(`${ phone }${ password }`), 
      role,
    }

    if(["/add"].includes(path_name)) {
      Object.assign(params, {
        nickname, avatar,
      })
    }

    const result = await Model.create({...params});

    if(["/add"].includes(path_name)) {
      const image = await ImageModel.findOne({ where: { url: avatar }, });
      if(!image) {
        return send({
          code: "USER-CREATE-000005",
          message: "图片查询异常",
        });
      }

      await image.update({ used: true, });
    }

    const context = result?.toJSON?.() || {};
    delete context?.password;

    send({
      code: config.SUCCESS_CODE,
      context,
      message: ["/add"].includes(path_name) ? "新增成功" : "注册成功",
    });
  } catch (error) {
    send({
      code: "USER-CREATE-000001",
      error,
    });
  }
};

/**
 * 登录用户
 * @param {*} req
 * @param {*} res
 * @returns 
 */
exports.login = async (req, res) => {
  const send = kit.createSendContentFn(req, res);

  try {
    const body = req.body || {};
    if(!body || !Object.keys(body).length) {
      return send({
        code: "USER-LOGIN-000002",
        message: "参数不正确",
      });
    }

    const { phone, password, } = body;
    if(!phone || !password) {
      return send({
        code: "USER-LOGIN-000003",
        message: "参数不正确",
      });
    }

    const pwd = kit.md5(`${ phone }${ password }`);
    const result = await Model.findOne({ 
      where: { 
        phone, 
        password: pwd, 
      },
      attributes: { exclude: ['password'] },
    });

    const user_info = result?.toJSON?.() || {};
    if(!user_info || !Object.keys(user_info).length) {
      return send({
        code: "USER-LOGIN-000004",
        message: "用户名或密码错误",
      });
    }

    const token = kit.getTokenFn({
      phone,
      role: user_info?.role,
    });
    Object.assign(user_info, { 
      token,
    });
  
    send({
      code: config.SUCCESS_CODE,
      context: user_info,
      message: "登录成功",
    });
    
  } catch (error) {
    send({
      code: "USER-LOGIN-000001",
      error,
    });
  }
};

/**
 * 删除指定用户
 * @param {*} req 
 * @param {*} res 
 */
exports.delete = async (req, res) => {
  const send = kit.createSendContentFn(req, res);

    try {
      const params = req.params || {};
      if(!params || !Object.keys(params).length) {
        return send({
          code: "USER-DELETE-000002",
          message: "参数不正确",
        });
      }

      const { id, } = params;
      if(!id) {
        return send({
          code: "USER-DELETE-000003",
          message: "参数不正确",
        });
      }

      const info = await Model.findByPk(id);
      if(!info) {
        return send({
          code: "USER-DELETE-000004",
          message: "用户信息查询异常",
        });
      }
  
      const delete_imgs = info?.avatar ? info?.avatar?.split?.('|') : [];
      const image_list = await ImageModel.findAll({ where: { url: delete_imgs }, });
      if(!Array.isArray(image_list)) {
        return send({
          code: "USER-DELETE-000005",
          message: "图片查询异常",
        });
      }
  
      const result = await Model.destroy({
        where: {...params},
      });
  
      await Promise.all(image_list.map(item => item.update({ used: false, })));
  
      send({
        code: result === 1 ? config.SUCCESS_CODE : "USER-DELETE-000006",
        message: result === 1 ? "删除成功" : "删除失败",
      });

    } catch (error) {
      send({
        code: "USER-DELETE-000001",
        error,
      });
    }
};

/**
 * 更新指定用户
 * @param {*} req 
 * @param {*} res 
 */
exports.update = async (req, res) => {
  const send = kit.createSendContentFn(req, res);

  try {
    const body = req.body || {};
    if (!body || !Object.keys(body).length) {
      return send({
        code: "USER-UPDATE-000002",
        message: "参数不正确",
      });
    }

    const { id, nickname, avatar, } = body;
    const role = body?.role || "2";
    if (!id || !nickname || !avatar || !role) {
      return send({
        code: "USER-UPDATE-000003",
        message: "参数不正确",
      });
    }

    const info = await Model.findByPk(id);
    if(!info) {
      return send({
        code: "USER-UPDATE-000006",
        message: "用户信息查询异常",
      });
    }

    const current_imgs = info?.avatar ? info?.avatar?.split?.('|') : [];
    const new_imgs = avatar;
    const imgs = [...current_imgs, ...new_imgs];
    const image_list = await ImageModel.findAll({ where: { url: imgs, }, });
    if(!Array.isArray(image_list)) {
      return send({
        code: "USER-UPDATE-000007",
        message: "图片查询异常",
      });
    }
    const [result] = await Model.update({
      nickname,
      avatar: new_imgs.join("|"),
      role,
    }, {
      where: { id, },
    });

    await Promise.all(image_list.map(item => item.update({ used: new_imgs.includes(item?.url), })));
    
    send({
      code: result === 1 ? config.SUCCESS_CODE : "USER-UPDATE-000008",
      message: result === 1 ? "更新成功" : "更新失败",
    });

  } catch (error) {
    send({
      code: "USER-UPDATE-000001",
      error,
    });
  }
};

/**
 * 根据筛选条件查询用户
 * @param {*} req 
 * @param {*} res 
 */
exports.list = async (req, res) => {
  const send = kit.createSendContentFn(req, res);

  try {
    const { phone, nickname, id, pageNum, pageSize, role, } = req.body || {};
    const page_num = pageNum ?? 0;
    const page_size = pageSize ?? 10;

    const params = {};
    if(id) {
      Object.assign(params, {
        id,
      });
    }

    if(role) {
      Object.assign(params, {
        role,
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

    const result = await Model.findAndCountAll({ 
      where: params,
      attributes: { exclude: ['password'] },
      order: [
        ['createdAt', 'DESC'],
      ],
      offset: page_num * page_size,
      limit: page_size,
    });

    const info = kit.getUserInfoFn(req);
    if(!info || !Object.keys(info).length) {
      return send({
        code: "USER-LIST-000002",
        message: "解析用户信息异常",
      });
    }

    const rows = result?.rows?.map?.(item => item?.get?.({ plain: true, }))?.filter?.(Boolean) || [];
    const total = result?.count ?? 0;
    const content = rows.map(item => {
      if(!item || !Object.keys(item).length) return;

      const img_list = String(item['avatar'] || "").split("|").filter(Boolean);
      const role = item?.role || "2";
      Object.assign(item, {
        createdAt: kit.dateToStringFn(item['createdAt']),
        updatedAt: kit.dateToStringFn(item['updatedAt']),
        avatar: img_list,
        role,
        isAction: info?.phone !== item?.phone && Number(role) > Number(info?.role),
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
        actions: kit.getRoleActionsFn(kit.getUserInfoFn(req)?.role),
      },
    });

  } catch (error) {
    send({
      code: "USER-LIST-000001",
      error,
    });
  }
};

/**
 * 退出登录
 * @param {*} req 
 * @param {*} res 
 */
exports.logout = async (req, res) => {
  const send = kit.createSendContentFn(req, res);

  try {
    const token = req?.headers?.authorization?.split?.(' ')?.[1] || "";
    const decoded = kit.getUserInfoFn(req);
    if(!decoded) {
      return send({
        code: "USER-LOGOUT-000002",
        message: "解析用户信息异常",
      });
    }

    const expiresIn = decoded.exp * 1000 - Date.now();
    await kit.addToBlacklistFn(token, expiresIn);
    
    send({
      code: config.SUCCESS_CODE,
      message: "退出登录成功",
    });
  } catch (error) {
    send({
      code: "USER-LOGOUT-000001",
      error,
    });
  }
}

/**
 * 重置用户密码
 * @param {*} req
 * @param {*} res
 * @returns 
 */
exports.resetPassword = async (req, res) => {
  const send = kit.createSendContentFn(req, res);

  try {
    const body = req.body || {};
    if(!body || !Object.keys(body).length) {
      return send({
        code: "USER-RESET_PASSWORD-000002",
        message: "参数不正确",
      });
    }

    const { id, phone, } = body;
    if(!id || !phone) {
      return send({
        code: "USER-RESET_PASSWORD-000002",
        message: "参数不正确",
      });
    }

    const context = kit.getRandomPasswordFn(6);
    const password = md5(context);
    const pwd = kit.md5(`${ phone }${ password }`);
    const [result] = await Model.update({
      password: pwd, 
    }, {
      where: { id, phone, },
    });
    if(result !== 1) {
      return send({
        code: "USER-RESET_PASSWORD-000003",
        message: "重置失败",
      });
    }
    
    send({
      code: config.SUCCESS_CODE,
      context,
      message: "重置成功",
    });
  } catch (error) {
    send({
      code: "USER-RESET_PASSWORD-000001",
      error,
    });
  }
};

/**
 * 修改用户密码
 * @param {*} req
 * @param {*} res
 * @returns 
 */
exports.changePassword = async (req, res) => {
  const send = kit.createSendContentFn(req, res);

  try {
    const body = req.body || {};
    if(!body || !Object.keys(body).length) {
      return send({
        code: "USER-CHANGE_PASSWORD-000002",
        message: "参数不正确",
      });
    }

    const { phone, oldPassword, password, } = body;
    if(!phone || !oldPassword || !password) {
      return send({
        code: "USER-CHANGE_PASSWORD-000002",
        message: "参数不正确",
      });
    }

    const old_password = kit.md5(`${ phone }${ oldPassword }`);
    const info = await Model.findOne({ 
      where: { 
        phone, 
        password: old_password, 
      },
      attributes: { exclude: ['password'] },
    });

    const user_info = info?.toJSON?.() || {};
    if(!user_info || !Object.keys(user_info).length) {
      return send({
        code: "USER-CHANGE_PASSWORD-000003",
        message: "旧密码错误",
      });
    }

    const new_password = kit.md5(`${ phone }${ password }`);
    await info?.update?.({
      password: new_password, 
    });

    send({
      code: config.SUCCESS_CODE,
      message: "修改成功",
    });
    
  } catch (error) {
    send({
      code: "USER-CHANGE_PASSWORD-000001",
      error,
    });
  }
};

/**
 * 查询登录用户信息
 * @param {*} req
 * @param {*} res
 * @returns 
 */
exports.info = async (req, res) => {
  const send = kit.createSendContentFn(req, res);

  try {
    const info = kit.getUserInfoFn(req);
    if(!info || !Object.keys(info).length) {
      return send({
        code: "USER-INFO-000002",
        message: "解析用户信息异常",
      });
    }

    const { phone, } = info;
    if(!phone) {
      return send({
        code: "USER-INFO-000003",
        message: "用户信息异常",
      });
    }

    const result = await Model.findOne({ 
      where: { 
        phone,
      },
      attributes: { exclude: ['password'] },
    });

    const user_info = result?.toJSON?.() || {};
    if(!user_info || !Object.keys(user_info).length) {
      return send({
        code: "USER-INFO-000004",
        message: "查询登录用户信息失败",
      });
    }

    send({
      code: config.SUCCESS_CODE,
      context: user_info,
      message: "查询登录用户信息成功",
    });
  } catch (error) {
    send({
      code: "USER-INFO-000001",
      error,
    });
  }
};

/**
 * 更新登录用户信息
 * @param {*} req 
 * @param {*} res 
 */
exports.updateInfo = async (req, res) => {
  const send = kit.createSendContentFn(req, res);

  try {
    const body = req.body || {};
    if (!body || !Object.keys(body).length) {
      return send({
        code: "USER-UPDATE_INFO-000002",
        message: "参数不正确",
      });
    }

    const { nickname, avatar, } = body;
    if (!nickname || !avatar) {
      return send({
        code: "USER-UPDATE_INFO-000003",
        message: "参数不正确",
      });
    }

    const login_info = kit.getUserInfoFn(req);
    if(!login_info || !Object.keys(login_info).length) {
      return send({
        code: "USER-UPDATE_INFO-000004",
        message: "解析用户信息异常",
      });
    }

    const info = await Model.findOne({ 
      where: { 
        phone: login_info?.phone,
      },
    });
    if(!info) {
      return send({
        code: "USER-UPDATE_INFO-000005",
        message: "用户信息查询异常",
      });
    }

    const current_imgs = info?.avatar ? info?.avatar?.split?.('|') : [];
    const new_imgs = avatar;
    const imgs = [...current_imgs, ...new_imgs];
    const image_list = await ImageModel.findAll({ where: { url: imgs, }, });
    if(!Array.isArray(image_list)) {
      return send({
        code: "USER-UPDATE_INFO-000006",
        message: "图片查询异常",
      });
    }
    const [result] = await Model.update({
      nickname,
      avatar: new_imgs.join("|"),
    }, {
      where: {
        phone: login_info?.phone,
      },
    });

    await Promise.all(image_list.map(item => item.update({ used: new_imgs.includes(item?.url), })));

    if(result !== 1) {
      return send({
        code: "USER-UPDATE_INFO-000006",
        message: "更新失败",
      });
    }
    
    send({
      code: config.SUCCESS_CODE,
      message: "更新成功",
    });

  } catch (error) {
    send({
      code: "USER-UPDATE_INFO-000001",
      error,
    });
  }
};
