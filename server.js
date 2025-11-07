if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const app = express();
const dotenv = require('dotenv')
const bodyparser = require('body-parser');
const session = require('express-session');
const morgan = require('morgan');

const connectDB = require('./server/database/connection')

const admin_router = require('./server/routes/admin/admin_routes');
const user_router = require('./server/routes/user/user_routes');

const PORT = process.env.PORT || 8080;

connectDB();

app.use(express.json());
// parse request to body-parser
app.use(bodyparser.urlencoded({extended:true}))

const cacheTime = 60;
app.use((req, res, next) => {
    res.setHeader("Cache-Control", `public,no-store, must-revalidate, max-age=${cacheTime}`);
    res.setHeader("Pragma", "no-cache");  
    next()
})

app.use(morgan('tiny'));

// set view engine
app.set('view engine', 'ejs');

app.use(express.static('assets'));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 300000 }
}));

app.use('/',admin_router );
app.use('/',user_router );

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});