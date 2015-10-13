
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var Sync = require('sync');
var app = express();
var mongoose = require('mongoose');

/**
 * DB related - MongoDB.
 */
var configDB = require('./config/database.js');
mongoose.connect(configDB.url);

var db = mongoose.connection;
db.on('error', function () {
    console.log('DB error')
});
db.once('open', function () {
    console.log('DB Opened');
});

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

require('./app/routes.js')(app); // load our routes and pass in our app and (TODO) fully configured passport

/**
 * Express web server.
 */

http.createServer(app).listen(app.get('port'), function () {
    console.log('node compiler v0.2 active on port ' + app.get('port'));
});
