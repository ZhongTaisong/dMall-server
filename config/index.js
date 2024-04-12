const PORT = 8000;

/**
 * 表格 - 每页条数
 */
exports.PAGE_SIZE = 10;

/**
 * 公共接口 - 正则匹配
 * 
 * 注：不需要验证访问权限
 */
exports.PUBLIC_PATH = /\/public\//;

/**
 * 私钥
 */
exports.SECRET_KEY = "雨色轻风意，柔情怜花殇";

/**
 * redis数据库key
 */
exports.REDIS_KEY = {
    // 登录token失效黑名单
    DMALL_JWT_BLACKLIST: "dmall_jwt_blacklist",
}

/**
 * 服务端端口号
 */
exports.PORT = PORT;

/**
 * 客户端接口请求url - 前缀
 */
exports.REQUEST_URL = `http://127.0.0.1:${ PORT }/api`;

/**
 * 接口请求成功code
 */
exports.SUCCESS_CODE = "DM000000";

/**
 * 用户头像 - 图片存储路径
 */
exports.AVATAR_PATH = "/public/assets/images/avatar";

/**
 * 商品 - 图片存储路径
 */
exports.GOODS_PATH = "/public/assets/images/goods";

/**
 * banner - 图片存储路径
 */
exports.BANNER_PATH = "/public/assets/images/goods/banner";

/**
 * 商品详情 - 图片存储路径
 */
exports.GOODS_DETAIL_PATH = "/public/assets/images/goods/detail";

/**
 * 商品主图 - 图片存储路径
 */
exports.GOODS_MAIN_PATH = "/public/assets/images/goods/main";
