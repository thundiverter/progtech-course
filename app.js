const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use("/static", express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));     // чтобы данные из форм нормально отправлялись
app.use(session({
    secret: 'loremIpsum',
    resave: false,
    saveUninitialized: true
}));

// routers
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
app.use('/', indexRouter);
app.use('/', authRouter);

const adminRouter = require('./routes/roles/admin');
const departmentRouter = require('./routes/roles/department');
const responsibleRouter = require('./routes/roles/responsible');
const dispatchRouter = require('./routes/roles/dispatcher');
app.use('/', adminRouter);
app.use('/', departmentRouter);
app.use('/', responsibleRouter);
app.use('/', dispatchRouter);

// 404 page
app.get('*', (req, res) => {
    res.render('404');
})


app.listen(PORT, () => console.log(`Listening: localhost:${PORT}`));