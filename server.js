require('rootpath')();
var express = require('express');
var app = express();
var cors = require('cors');
var md5 = require('md5');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var config = require('config.json');

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// use JWT auth to secure the api, the token can be passed in the authorization header or querystring
app.use(expressJwt({
    secret: config.secret,
    getToken: function (req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
    }
}).unless({path: ['/users/authenticate', '/auth/generate', '/auth/verify', '/auth/sendmail', '/auth/reset']}));

// routes
app.use('/users', require('./controllers/users.controller'));
app.use('/exam', require('./controllers/exam.controller'));
app.use('/auth', require('./controllers/auth.controller'));
app.use('/video', require('./controllers/video.controller'));
app.use('/profile', require('./controllers/userProfile.controller'));
app.use('/' + md5('admin' + (new Date).getDate()), require('./controllers/admin.controller'));   // DYNAMIC CONTROLLER FOR ADMIN

// start server
var port = process.env.npm === 'production' ? 80 : 4000;
var server = app.listen(port, function () {
    console.log('Server listening on port ' + port);
});
