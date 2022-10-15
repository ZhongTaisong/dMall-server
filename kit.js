const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const lodash = require('lodash');
const uuid = require('uuid');
const multer = require('multer');
const redisClient = require('./redis-client');

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
 * 上传图片 - 配置项
 */
exports.upload = (pathname) => (filenameKey) => {
    return multer({ 
        storage: multer.diskStorage({
            destination: function(req, file, cb) {
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
                const key = Date.now() + '_' + Math.round(Math.random() * 1E9);
                const suffix = {
                    "image/png": 'png',
                    "image/jpeg": 'jpg',
                };
                
                cb(null, `${ filenameKey || key }.${ suffix[mimetype] || 'jpg' }`);
            }
        }), 
    });
};
