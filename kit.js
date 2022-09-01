const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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
