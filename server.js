
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var child_process = require('child_process');
var Sync = require('sync');
var app = express();
var mongoose = require('mongoose');
var shortid = require('shortid');
var endOfLine = require('os').EOL;

mongoose.connect("mongodb://localhost/onlineCoding");

var problemSchema = mongoose.Schema({
    id: String,
    title: String,
    description: String,
    examples: String,
    testCases: [
	{
	    id: String,
	    desc: String,
	    input: String,
	    output: String
	}],
    instructorCode: String,
    userCode: String
}
);

var problemModel = mongoose.model('problemModel', problemSchema);

var db = mongoose.connection;
db.on('error', function () {
    console.log('DB error')
});
db.once('open', function () {
    console.log('DB Opened');
});

// all environments
app.set('port', process.env.PORT || 3000);
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

var child = child_process.fork(__dirname + '/child-win.js');
var submissionWorkflow = child_process.fork(__dirname + '/winSubmissionWorkflow.js');
var taskId = 1;
var tasks = {};
var cb = function () { };
var maxQueue = 10;

function addTask(data, callback) {
    // taskId++;
    // if (taskId > 10) taskId = 1;
    Sync(function () {
        //taskId++;
        if (taskId > maxQueue)
            taskId = 1;
        tasks[taskId] = callback;
        child.send({ id: taskId, script: data.script, inputs: data.inputs });
    });
}

child.on('message', function (message) {
    // Look up the callback bound to this id and invoke it with the result
    tasks[message.id](message);
});

submissionWorkflow.on('message', function (message) {
    console.log(message);
    cb(message);
});

child.on('exit', function (code, signal) {
    console.log('Child exited:', code, signal);
});

app.get('/', function (req, res) {
    res.sendfile(__dirname + '\\angular_Home.html');
});

app.get('/compile', function (req, res) {
    res.render("index.ejs");
});

app.get('/question/:questionId', function (req, res) {
    var id = req.params.questionId;
    console.log("id: " + id);
    problemModel.findOne({ id: id }, function (err, prob) {
        res.render('submission', { title: prob.title, description: prob.description, userCode: prob.userCode,  id: prob.id});
    });
});

app.get('/questions', function (req, res) {
    problemModel.find({}, 'id title', function (err, prob) {
        res.send(JSON.stringify({ questions: prob }));
    });
});

app.post('/questions', function (req, res) {
    var id = shortid.generate();
    var title = req.body.title;
    var desc = req.body.description;
    var examples = req.body.examples || '';
    var testCases = req.body.testCases;
    var instructorCode = req.body.instructorCode;
    var userCode = req.body.userCode;

    var tcJson = [];
    var tcId = 1;
    var tcStr = testCases.split(endOfLine);
    tcStr.forEach(
        function prepareJson(val) {
            var comp = val.split('#');
            tcJson.push({
                id: tcId,
                desc: comp[0],
                input: comp[1],
                output: comp[2]
            });
            tcId++;
        }
    );

    var prob = new problemModel({
        id: id, title: title, description: desc,
        examples: examples, testCases: tcJson,
        instructorCode: instructorCode, userCode: userCode
    });

    prob.save(function (err) {
        if (err)
            return res.json({
                msg: 'Failure',
                err: err
            });
    });

    res.json({
        msg: 'Success',
        id: id
    });
});

function startWorkflow(data, callback) {
    cb = callback;
    submissionWorkflow.send({ data: data.script, prob: data.prob });
}
app.post('/compile', function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');

    var script = req.body.script;
    var probId = req.body.probId;
    var masterCode = '';
    problemModel.findOne({ id: probId }, function (err, prob) {
        startWorkflow({ script: script, prob: prob }, function (result) {
            res.json(result);
        });
    });

});

http.createServer(app).listen(app.get('port'), function () {
    console.log('node compiler v0.2 active on port ' + app.get('port'));
});
