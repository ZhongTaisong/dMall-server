const { default: axios } = require('axios');
const config = require('./config');

/** 创建axios实例 */
const axiosInstance = axios.create({
    baseURL: config.REQUEST_URL,
    timeout: 30 * 1000,
    withCredentials: true,
});

/**
 * 插入axios请求头
 * @param {*} req 
 */
exports.insertAxiosHeaders = (req) => {
    const { authorization, uname, } = req.headers;

    /**
     * 请求拦截器
     */
    axiosInstance.interceptors.request.use(
        config => {
            config.headers = {
                authorization,
                uname,
            };
            return config;
        }, 
        error => Promise.reject(error)
    );
};

exports.use = axiosInstance;
