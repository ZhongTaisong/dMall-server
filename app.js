const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const pool = require('./pool');
const auth = require('./auth');
// 引入路由模块
const homeRouter = require('./routes/home.js');
const goodsListRouter = require('./routes/goods-list.js');
const goodsDetailRouter = require('./routes/goods-detail.js');
const userRouter = require('./routes/user.js');
const cartRouter = require('./routes/cart.js');
const goodsEvaluateRouter = require('./routes/goods-evaluate.js');
const brandRouter = require('./routes/brand.js');
const dictionariesRouter = require('./routes/dictionaries.js');
const orderRouter = require('./routes/order.js');
const collectionRouter = require('./routes/collection.js');
const addressRouter = require('./routes/address.js');
const messageRouter = require('./routes/message.js');
const adminRouter = require('./routes/admin.js');
const app = express();

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

// 用户认证 - 操作
app.all("*", (req, res, next) => {
    // 将pool挂在到req上
    req.pool = pool;
    return auth(req, res, next);
});

// 接口路由
app.use('/api/home', homeRouter);
app.use('/api/goods-list', goodsListRouter);
app.use('/api/goods-detail', goodsDetailRouter);
app.use('/api/user', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/goods-evaluate', goodsEvaluateRouter);
app.use('/api/brand', brandRouter);
app.use('/api/dic', dictionariesRouter);
app.use('/api/order', orderRouter);
app.use('/api/collection', collectionRouter);
app.use('/api/address', addressRouter);
app.use('/api/message', messageRouter);
app.use('/api/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// 自定义端口号
process.env.PORT = '8000';

module.exports = app;
