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
 * 拼接 - 异常code
 * @param {*} prefix 前缀
 * @returns 
 */
exports.joinErrCode = (prefix) => (code) => {
    if(!prefix || !code) return;

    return `${prefix}-${ code }`;
}

/**
 * 返回响应结果 - 标准结构
 * @param {*} params 
 * @returns 
 */
exports.getSendContent = (params = {}) => {
    if (!params || !Object.keys(params).length) return;

    return {
        // 结果code
        code: null,
        // 主体内容
        content: null,
        // 操作提示
        msg: null,
        // 错误内容
        error: null,
        ...params,
    };
}

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
}
