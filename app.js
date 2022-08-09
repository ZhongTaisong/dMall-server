const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const pool = require('./pool');
const config = require('./config');
// 引入路由模块
const indexRouter = require('./routes/index.js');
const productRouter = require('./routes/product.js');
const detailRouter = require('./routes/detail.js');
const userRouter = require('./routes/user.js');
const cartRouter = require('./routes/cart.js');
const commentRouter = require('./routes/comment.js');
const brandRouter = require('./routes/brand.js');
const dictionariesRouter = require('./routes/dictionaries.js');
const orderRouter = require('./routes/order.js');
const collectionRouter = require('./routes/collection.js');
const addressRouter = require('./routes/address.js');
const messageRouter = require('./routes/message.js');
const adminRouter = require('./routes/admin.js');
const publicRouter = require('./routes/public.js');
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

app.all("*", (req, res, next) => {
    const { token, uname } = req?.headers || {};

    if(/^(\/api\/public)/.test(req?.path)) {
        return next();
    }

    if(!uname) {
        return res.status(401).send({
            code: "DM-000001",
            msg: '认证失败!',
        });
    }

    if (!token) {
        return res.status(401).send({
            code: "DM-000002",
            msg: '认证失败!',
        });
    }
    
    pool.query(
        `SELECT * FROM dm_user WHERE upwd=${ token } AND uname=${ uname }`, 
        null, 
        (err, result) => {
            if(err) {
                return res.status(500).send({
                    code: "DM-000003",
                    msg: '操作失败!',
                    error: err,
                });
            };

            if(!data?.length) {
                return res.status(401).send({
                    code: "DM-000004",
                    msg: '登录token已失效, 请重新登录!',
                });
            }

            next();
        }
    );
});

app.use('/api/index', indexRouter);
app.use('/api/products', productRouter);
app.use('/api/details', detailRouter);
app.use('/api/users', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/comment', commentRouter);
app.use('/api/brand', brandRouter);
app.use('/api/dic', dictionariesRouter);
app.use('/api/order', orderRouter);
app.use('/api/collection', collectionRouter);
app.use('/api/address', addressRouter);
app.use('/api/message', messageRouter);
app.use('/api/admin', adminRouter);
app.use('/api/public', publicRouter);

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
