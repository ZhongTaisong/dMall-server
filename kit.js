const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const lodash = require('lodash');
const uuid = require('uuid');
const multer = require('multer');
const redisClient = require('./redis-client');
const config = require('./config');
const moment = require('moment');
// 生成token
const jwt = require('jsonwebtoken');
const model = require("./sequelize/model/index");
const BlackTokenListModel = model["blackTokenList"];

/**
 * 获取 - 请求成功后的数据
 * @param {*} obj 
 * @returns 
 */
exports.fnGetPromiseValue = (obj) => {
    if (!obj || !Object.keys(obj).length) return;
    if (!['fulfilled', 'rejected'].includes(obj?.status)) return;
    if (obj?.status === 'rejected') return;

    return obj.value;
};

/**
 * 二次封装 - Promise.allSettled
 * @param {*} data 
 * @returns 
 */
exports.promiseAllSettled = (data) => {
    if(!Array.isArray(data)) return Promise.resolve([]);
    if(data.some(item => typeof item?.then !== 'function')) return Promise.resolve([]);

    return Promise.allSettled(data).then((result) => {
        if (!Array.isArray(result)) return [];

        return result.map((item) => this.fnGetPromiseValue(item)) || [];
    });
};

/**
 * md5加密
 * @param {*} val 
 * @returns 
 */
exports.md5 = (val) => {
    const md5 = crypto.createHash('md5');
    return md5.update(val).digest('hex');
};

/**
 * token如果已写入黑名单，表示已失效
 * @param {*} data 
 * @returns 
 */
exports.isJWTInvalid = (data) => {
    if(!data) return;

    const isExist = fs.existsSync(jwt_blacklist_path);
    if(!isExist) {
        return false;
    }

    const content = fs.readFileSync(jwt_blacklist_path).toString();
    return content.includes(data);
};

/**
 * redis存储 - String类型值
 */
exports.setRedisStringValue = (key, value) => {
    if(typeof value !== 'string') return;

    redisClient.SET(key, value);
}

/**
 * redis获取 - String值
 * @param {*} key 
 */
exports.getRedisStringValue = async (key) => {
    const value = await redisClient.GET(key);
    return value;
}

/**
 * redis存储 - Hash值
 */
exports.setRedisHashValue = (key, value) => {
    if(!lodash.isPlainObject(value)) return;

    Object.entries(value).forEach(([fields, val]) => {
        redisClient.HSET(key, fields, val);
    });
}

/**
 * redis获取 - Hash单个值
 * @param {*} key 
 * @param {*} fields 
 */
exports.getRedisHashValue = async (key, fields) => {
    const value = await redisClient.HGET(key, fields);
    return value;
}

/**
 * redis获取 - Hash所有值
 * @param {*} key 
 * @param {*} fields 
 */
exports.getRedisHashValueAll = async (key) => {
    const value = await redisClient.hGetAll(key);
    return value;
}

/**
 * redis - 查看哈希表 key 中，指定的字段是否存在。
 * @param {*} key 
 * @param {*} fields 
 * @returns 
 */
exports.isRedisHashValue = (key, fields) => {
    return redisClient.hExists(key, fields);
}

/**
 * redis - 设置失效时间
 */
exports.setRedisExpireTime = (key, value) => {
    if(typeof value !== 'number') return;

    redisClient.EXPIRE(key, value);
}

/**
 * 生成随机id
 * @returns 
 */
exports.getUuid = () => {
    return uuid.v4();
}

/**
 * 校验 - 手机号码
 * @param value 
 * @returns 
 */
exports.validatePhone = (value) => {
    const reg = /^1[3-9]\d{9}$/;
    return reg.test(value);
};

/**
 * 生成 - 初始密码
 */
exports.getInitPassword = () => Math.random().toString().slice(2, 8);

/**
 * 上传文件 - 配置项
 * @param {*} params 
 * @returns 
 */
exports.upload = (params) => {
    if(!params || !Object.keys(params).length) return;

    const path_map = {
        user: config.USER_PATH,
        goodsImgs: config.GOODS_PATH,
    };

    let { fileName, fileFormat, } = params;
    if(!Array.isArray(fileFormat) || !fileFormat.length) {
        fileFormat = [];
    }
    
    return multer({ 
        limits: {
            // 2MB
            fieldSize: 2097152,
        },
        fileFilter(req, file, cb) {
            if(!file || !Object.keys(file).length) return;

            const { mimetype, } = file;
            if(!fileFormat.length) {
                cb(null, true);

            }else {
                const bol = fileFormat.includes(mimetype);
                cb(null, bol);
            }
        },
        storage: multer.diskStorage({
            destination: function(req, file, cb) {
                if(!file || !Object.keys(file).length) return;

                const { fieldname, } = file;
                const pathname = path_map[fieldname];
                if(!pathname) return;

                const _pathname = path.join(__dirname, ".", pathname);
                if(!fs.existsSync(_pathname)) {
                    fs.mkdirSync(_pathname, { recursive: true, });
                }

                cb(null, _pathname);
            },
            filename: function(req, file, cb) {
                if(!file || !Object.keys(file).length) return;

                const file_name = fileName || `${ Date.now() }${ Math.round(Math.random() * 1E9) }`;
                const { mimetype, } = file;
                const suffix = mimetype.split("/")[1];
                cb(null, `${ exports.md5(file_name) }.${ suffix || 'jpg' }`);
            }
        }), 
    });
};

/** 设置响应数据格式 */
exports.setResponseDataFormat = (code = config.SUCCESS_CODE) => (content = null) => (msg = null) => ({ code, content, msg, });

/** 批量删除对象属性 - 操作 */
exports.batchDeleteObjKeyFn = (obj) => (list) => {
    if(!Array.isArray(list) || !list.length) return;
    if(!obj || !Object.keys(obj).length) return;

    list.forEach(item => {
        if(item) {
            delete obj[item];
        }
    })
}

/**
 * 校验 - 用户密码
 * @param value
 * @returns 
 */
exports.validatePasswordFn = (value) => {
    const min = 6;
    const max = 8;
    const reg = new RegExp(`^[0-9]{${ min },${ max }}$`);
    return {
        bol: reg.test(value),
        tip: "仅限输入数字",
        min,
        max,
    };
};

/**
 * 生成用户token - 操作
 * @param {*} user_info 
 * @param {*} expiresIn 
 * @returns 
 */
exports.getTokenFn = (user_info = {}, expiresIn = '3h') => {
    if(!user_info || !Object.keys(user_info).length) return null;

    return jwt.sign(
        user_info, 
        config.SECRET_KEY, 
        { expiresIn, },
    );
}
/**
 * 字段是否已存在 - 操作
 * @param {*} where 
 * @returns 
 */
exports.isExistFn = (Model) => (where) => {
    if(!Model || !Object.keys(Model).length) return Promise.resolve(null);
    if(!where || !Object.keys(where).length) return Promise.resolve(null);

    return new Promise(resolve => {
        Model.findOne({ where, }).then(res => {
            resolve(res);
        }).catch(err => {
            resolve(null);
        })
    });
}

/**
 * Date格式日期转字符串 - 操作
 * @param {*} date 
 * @param {*} format 
 * @returns 
 */
exports.dateToStringFn = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
    if(!date || !format) return null;

    return moment(date).format(format);
}

/**
 * 删除文件 - 操作
 * @param {*} path 
 */
exports.fsUnlinkFn = (path) => {
    try {
        if(!path) {
            return console.log('待删除文件路径path不能为空');
        };
    
        fs.unlink(path, err => {
            if(err) {
                return console.log('文件删除失败', err);
            }
    
            console.log('文件删除成功');
        });
    } catch (error) {
        console.log('文件删除失败', error);
    }
}

/**
 * 拼接完整图片url - 操作
 * @param {*} pathType 
 * @param {*} url 
 * @returns 
 */
exports.joinFullImgUrlFn = (pathType, url) => {
    if(!pathType || !url) return "";

    const path = config[pathType];
    if(!path) return "";

    return `${ config.REQUEST_URL }${ path }/${ url }`;
}

/**
 * 删除文件 - 批量操作
 * @param {*} paths 
 * @returns 
 */
exports.batchFsUnlinkFn = (paths) => {
    try {
        if(!Array.isArray(paths) || !paths.length) {
            return console.log('待批量删除文件路径集合不能为空');
        };
    
        paths.forEach(item => {
            const path = String(item || "");
            if(path) {
                exports.fsUnlinkFn(path);
            }
        });
    } catch (error) {
        console.log('文件批量删除失败', error);
    }
}

/**
 * 拼接完整图片url - 批量操作
 * @param {*} pathType 
 * @param {*} urls 
 * @returns 
 */
exports.batchJoinFullImgUrlFn = (pathType, urls) => {
    if(!Array.isArray(urls) || !urls.length) {
        return console.log('待批量删除文件路径集合不能为空');
    };

    return urls.map(item => {
        const url = String(item || "");
        return exports.joinFullImgUrlFn(pathType, url);
    }).filter(Boolean);
}

/**
 * 上传图片 - 配置项
 */
exports.uploadImgFn = (params) => {
    return exports.upload({
        fileFormat: ["image/png", "image/jpeg"],
        ...params,
    });
};

/**
 * 创建响应体 - 操作
 * @param res 
 * @param params 
 * @returns 
 */
exports.createSendContentFn = (req, res) => (params) => {
    if(!res || !Object.keys(res).length) return;

    const code = params?.code ?? null;
    const context = params?.context ?? null;
    const error = params?.error ?? null;
    let message = params?.message ?? null;
    if(!message) {
        message = code === config.SUCCESS_CODE ? "操作成功" : "操作失败";
    }

    if(code !== config.SUCCESS_CODE) {
        exports.createLogContentFn({
            path: code,
            msg: message,
            error,
        });
    }

    res?.status?.(200)?.send({
        code,
        context,
        message: exports.i18nParserTextFn(req, message),
    });
}

/**
 * 创建日志信息 - 操作
 * @param params 
 * @returns 
 */
exports.createLogContentFn = (params) => {
    if(!params || !Object.keys(params).length) return;

    const date = new Date();
    const time = date.toLocaleString();
    const { path, msg, error, } = params;
    if(!path) return;

    console.log(`${ time } --- ${ path } --- ${ msg || "操作失败" }`, { content: error || {}, });
}

/**
 * 生成随机密码
 * @param {*} n 
 * @returns 
 */
exports.getRandomPasswordFn = (n) => {
    const n0 = n || 6;
    const n1 = 2;
    const n2 = 2 + n0;
    let password = Math.random().toString().slice(n1, n2);
    if(password?.length < 6) {
        return getRandomPasswordFn(n0);
    }

    return password;
}

/**
 * 登录令牌黑名单 - 加入操作
 * @param {*} token 
 * @param {*} expiresIn 
 */
exports.addToBlacklistFn = async (token, expiresIn) => {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    await BlackTokenListModel.create({ token, expiresAt });
 }

 /**
 * 登录令牌是否已加入黑名单 - 判断操作
 * @param {*} token 
 */
 exports.isTokenBlacklistedFn = async (token) => {
    const result = await BlackTokenListModel.findOne({ where: { token } });
    return result !== null;   
 }
    
/**
 * 清理过期令牌 - 操作
 */
 exports.clearExpiredTokensFn = async () => {
    await BlackTokenListModel.destroy({
      where: {
        expiresAt: {
          [Sequelize.Op.lte]: new Date(),
        },
      },
    });
 }

 /**
  * 角色操作权限 - 获取操作
  * @returns 
  */
 exports.getRoleActionsFn = (role) => {
    let actions = [];

    switch (role) {
      case "0":
        actions = ["add", "upate", "delete", "reset_password",];
        break;
      case "1":
        actions = ["add", "upate",];
        break;
    }

    return actions;
 }

 /**
  * 获取当前登录用户信息 - 操作
  * @param {*} req 
  * @returns 
  */
 exports.getUserInfoFn = (req) => {
    const token = req?.headers?.authorization?.split?.(' ')?.[1] || "";
    const info = jwt.decode(token);
    return info;
 }

 /**
  * 终端类型是否为PC - 判断操作
  * @param {*} req 
  * @returns 
  */
 exports.isPCFn = (req) => {
    const terminal = req?.headers?.terminal || "";
    return terminal === "PC";
 }

 /**
  * 终端类型是否为BOSS - 判断操作
  * @param {*} req 
  * @returns 
  */
 exports.isBossFn = (req) => {
    const terminal = req?.headers?.terminal || "";
    return terminal === "BOSS";
 }

 exports.i18nParserTextFn = (req, text) => {
    if(!text) return "";

    const lang = req?.headers?.lang || "zh";
    try {
        const json = require(`./i18n/language/${ lang }-i18n.json`);
        return json[text] || text;
    } catch (error) {
        exports.createLogContentFn({
            path: "i18nParserTextFn",
            error,
        });
    }

    return text;
 }
