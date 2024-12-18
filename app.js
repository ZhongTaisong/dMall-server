const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
// 验证token
const { expressjwt } = require('express-jwt');
const pool = require('./pool');
const config = require('./config');
const kit = require('./kit');
const app = express();
const multer = require('multer');

if(process.env.NODE_ENV === 'production') {
  // 开启安全防护
  app.use(helmet());
}

// 跨域访问 - 配置
app.use(cors({
    // 源
    origin: true,
    // 指定请求方式
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    // 是否允许传递请求头
    credentials: true,
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/api/public', express.static(path.join(__dirname, 'public')));

/** 将pool挂在到req上 */
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

/** 验证token */
app.use(
  expressjwt({ 
    secret: config.SECRET_KEY, 
    algorithms: ['HS256'],
    isRevoked: async (req) => {
      const token = req?.headers?.authorization?.split?.(' ')?.[1] || "";
      const blacklisted = await kit.isTokenBlacklistedFn(token);
      return blacklisted;
    },
  }).unless({ path: [config.PUBLIC_PATH,] })
);

app.use(function(err, req, res, next) {
  const send = kit.createSendContentFn(res);
  if(err?.name === 'UnauthorizedError') {
    return send({
      code: "APP-ERR-000001",
      message: "身份认证失败",
      error: err,
    });
  } 

  if(err instanceof multer.MulterError) {
    return send({
      code: "APP-ERR-000002",
      message: "上传操作异常",
      error: err,
    });
  }
});

/** 路由中间件 */
app.use('/api/image', require('./router/image.router.js')());
app.use('/api/user', require('./router/user.router.js')());
app.use('/api/goods-brand', require('./router/goods-brand.router.js')());
app.use('/api/goods', require('./router/goods.router.js')());

/** 自定义端口号 */
process.env.PORT = config.PORT;

module.exports = app;
