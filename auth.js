// 路由器标识
const ROUTER_Flag = "AUTH";

module.exports = (req, res, next) => {
    const { token, uname } = req?.headers || {};

    if(req?.path?.includes?.("/api/") && req?.path?.includes?.("/public/")) {
        return next();
    }

    if(!uname || ['null', 'undefined'].includes(uname)) {
        return res.status(401).send({
            code: `DM-${ ROUTER_Flag }-000001`,
            msg: '认证失败!',
        });
    }

    if (!token || ['null', 'undefined'].includes(token)) {
        return res.status(401).send({
            code: `DM-${ ROUTER_Flag }-000002`,
            msg: '认证失败!',
        });
    }
    
    req?.pool?.query?.(
        `SELECT * FROM dm_user WHERE upwd=? AND uname=?`, 
        [ token, uname ], 
        (err, result) => {
            if(err) {
                return res.status(500).send({
                    code: `DM-${ ROUTER_Flag }-000003`,
                    msg: '操作失败!',
                    error: err,
                });
            };

            if(!result?.length) {
                return res.status(401).send({
                    code: `DM-${ ROUTER_Flag }-000004`,
                    msg: '登录token已失效, 请重新登录!',
                });
            }

            next();
        }
    );
}