/**
 * 表格 - 每页条数
 */
exports.PAGE_SIZE = 10;

/**
 * 接口 - 白名单
 */
exports.REQUEST_URL_WHITE_LIST = [
    '/api/index/onepush',
    '/api/index/banner',
    '/api/index/hot',
    '/api/products/select',
    '/api/index/kw',
    '/api/users/log',
    '/api/users/vali/forgetPwd',
    '/api/users/update/upwd',
    '/api/users/reg',
    '/api/details/select',
    '/api/cart/select/num',
    '/api/comment/select/pid',
    '/api/dic/selectDic',
    '/api/products/select/filter',
    '/api/users/logout',
    '/api/message/select'
];

/**
 * 公共接口 - 正则匹配
 * 
 * 注：不需要验证访问权限
 */
exports.PUBLIC_PATH = ["//"];

/**
 * 私钥
 */
exports.SECRET_KEY = "雨色轻风意，柔情怜花殇";
