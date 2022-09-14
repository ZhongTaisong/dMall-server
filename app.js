const createError = require('http-errors');
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
// 路由器标识
const ROUTER_Flag = "APP";

// 视图模板引擎 - 配置
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

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
app.use('/api', express.static(path.join(__dirname, 'public')));

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
  }).unless({ path: [config.PUBLIC_PATH,] })
);

/** 当“退出登录”时，验证token是否在jwt黑名单中 */
app.use(async (req, res, next) => {
  const { authorization, uname, } = req.headers;
  if(!config.PUBLIC_PATH.test(req.url)) {
    const pwd = await kit.getRedisHashValue(config.REDIS_KEY.DMALL_JWT_BLACKLIST, uname);
    if(pwd === authorization.slice(7)) {
      return next(createError(401));
    }
  }

  next();
});

/** 接口路由 */
app.use('/api/home', require('./routes/home.js'));
app.use('/api/goods-list', require('./routes/goods-list.js'));
app.use('/api/goods-detail', require('./routes/goods-detail.js'));
app.use('/api/message-board', require('./routes/message-board.js'));
app.use('/api/user', require('./routes/user.js'));
app.use('/api/cart', require('./routes/cart.js'));
app.use('/api/goods-evaluate', require('./routes/goods-evaluate.js'));
app.use('/api/brand', require('./routes/brand.js'));
app.use('/api/dic', require('./routes/dictionaries.js'));
app.use('/api/order', require('./routes/order.js'));
app.use('/api/collection', require('./routes/collection.js'));
app.use('/api/address', require('./routes/address.js'));
app.use('/api/admin', require('./routes/admin.js'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  if(err.status === 401) {
    return res.status(401).send({
      code: `DM-${ ROUTER_Flag }-000001`,
      msg: '身份认证失败!',
    });
  }
  
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/** 自定义端口号 */
process.env.PORT = config.PORT;

module.exports = app;
