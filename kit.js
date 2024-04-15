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

// jwt-blacklist.txt 文件路径
const jwt_blacklist_path = path.join(__dirname, 'jwt-blacklist.txt');
/**
 * 将token写入黑名单
 * @param {*} data 
 * @returns 
 */
exports.writeJWTBlackListFn = (data) => {
    if(!data) return;

    const isExist = fs.existsSync(jwt_blacklist_path);
    if(!isExist) {
        fs.writeFileSync(jwt_blacklist_path, data);

    }else {
        const content = fs.readFileSync(jwt_blacklist_path).toString();
        fs.writeFileSync(jwt_blacklist_path, `${ content }\r\n${ data }`);
    }
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
    const reg = /^((1[3,5,8][0-9])|(14[5,7])|(17[0,6,7,8])|(19[7]))\d{8}$/;
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
        avatar: config.AVATAR_PATH,
        main_picture: config.GOODS_MAIN_PATH,
        goods_picture: config.GOODS_MAIN_PATH,
        detail_picture: config.GOODS_DETAIL_PATH,
        banner_picture: config.BANNER_PATH,
        goods_imgs: config.GOODS_PATH,
    };

    let { fileName, fileFormat, } = params;
    fileName = fileName || `${ Date.now() }${ Math.round(Math.random() * 1E9) }`;

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

                const { mimetype, } = file;
                const suffix = mimetype.split("/")[1];
                cb(null, `${ exports.md5(fileName) }.${ suffix || 'jpg' }`);
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
    const reg = new RegExp(`^[A-Za-z0-9]{${ min },${ max }}$`);
    return {
        bol: reg.test(value),
        tip: "仅限输入数字、字母 或 两者组合",
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
