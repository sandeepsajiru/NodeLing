
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

/**
 * DB related - MongoDB.
 */

mongoose.connect("mongodb://localhost/onlineCoding");

var problemSchema = mongoose.Schema({
    id: String,
    title: String,
    description: String,
    example: String,
    language: String,
    section: String,
    explaination: String,
    testCases: [
	{
	    id: String,
	    desc: String,
	    input: String,
	    expectedOutput: String,
        actualOutput: String
	}],
    instructorCode: String,
    userCode: String,
    solutionCode: String
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
};

var submissionWorkflow = child_process.fork(__dirname + '/winSubmissionWorkflow.js');

submissionWorkflow.on('message', function (message) {
    cb(message);
});

function startWorkflow(data, callback) {
    cb = callback;
    submissionWorkflow.send({ data: data.script, prob: data.prob });
};

var child = child_process.fork(__dirname + '/child-win.js');

child.on('message', function (message) {
    // Look up the callback bound to this id and invoke it with the result
    tasks[message.id](message);
});

child.on('exit', function (code, signal) {
    console.log('Child exited:', code, signal);
});

/**
 * HTTP GET routes.
 */

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/public/angular_Home.html');
});

app.get('/compile', function (req, res) {
    res.render("index.ejs");
});

app.get('/question/:questionId', function (req, res) {
    var id = req.params.questionId;
    problemModel.findOne({ id: id }, function (err, prob) {
        res.format({
            json: function () {
                res.send({ problem: prob });
            },
            html: function () {
                res.render('submission', { problem: prob });
            }
        });
    });
});

app.get('/questions', function (req, res) {
    problemModel.find({}, 'id title description language section', function (err, prob) {
        res.send(JSON.stringify({ questions: prob }));
    });
});

/**
 * HTTP POST routes.
 */

app.post('/questions', function (req, res) {
    var id = shortid.generate();
    var title = req.body.title;
    var desc = req.body.description;
    var example = req.body.example || '';
    var explaination = req.body.explaination || '';
    var testCases = req.body.testCases;
    var instructorCode = req.body.instructorCode;
    var userCode = req.body.userCode;
    var solutionCode = req.body.solutionCode;
    var language = req.body.language;
    var section = req.body.section;

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
                expectedOutput: comp[2]
            });
            tcId++;
        }
    );

    var prob = new problemModel({
        id: id, title: title, description: desc,
        example: example, explaination: explaination, testCases: tcJson,
        instructorCode: instructorCode, userCode: userCode, solutionCode: solutionCode, language: language, section: section
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

app.post('/compile', function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');

    var script = req.body.script;
    var probId = req.body.probId;

    problemModel.findOne({ id: probId }, function (err, prob) {
        startWorkflow({ script: script, prob: prob }, function (result) {
            res.json(result);
        });
    });
});


/**
 * Express web server.
 */

http.createServer(app).listen(app.get('port'), function () {
    console.log('node compiler v0.2 active on port ' + app.get('port'));
});
