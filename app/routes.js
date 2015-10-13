var shortid = require('shortid');
var endOfLine = require('os').EOL;
var child_process = require('child_process');
var problemModel = require('./models/problem.js');

var cb = function () { };

var submissionWorkflow = child_process.fork('winSubmissionWorkflow.js');

submissionWorkflow.on('message', function (message) {
    cb(message);
});

function startWorkflow(data, callback) {
    cb = callback;
    submissionWorkflow.send({ data: data.script, prob: data.prob });
};

module.exports = function (app) {
    /**
    * HTTP GET routes.
    */

    app.get('/', function (req, res) {
        res.sendfile('public/angular_Home.html');
    });

    app.get('/add', function (req, res) {
        res.sendfile('public/addProblem.html');
    });

    app.get('/edit', function (req, res) {
        res.sendfile('public/editProblem.html');
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

    app.get('/questions/:language', function (req, res) {
        var language = req.params.language;
        problemModel.find({ language: language }, 'id title description language section', function (err, prob) {
            res.send(JSON.stringify({ questions: prob }));
        });
    });

    app.get('/questions/:language/:section', function (req, res) {
        var language = req.params.language;
        var section = req.params.section;
        problemModel.find({ language: language, section: section }, 'id title description language section', function (err, prob) {
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
        var tcStr = testCases.split('~');
        tcStr.forEach(
            function prepareJson(val) {
                if (val.trim().length != 0) {
                    var comp = val.split('#');
                    tcJson.push({
                        id: tcId,
                        desc: comp[0],
                        input: comp[1],
                        expectedOutput: comp[2]
                    });
                }
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

    app.put('/question/update/:questionId', (function (req, res) {
        var id = req.params.questionId;

        problemModel.findOne({ id: id }, function (err, prob) {
            if (err) {
                return res.send(err);
            }
            for (prop in req.body) {
                prob[prop] = req.body[prop];
                console.log(prob[prop]);
            }

            // save the problem
            prob.save(function (err) {
                if (err) {
                    return res.send(err);
                }

                res.format({
                    json: function () {
                        res.send({ message: 'problem updated!' });
                    },
                    html: function () {
                        res.render('updation', { problem: prob });
                    }
                });
            });
        });
    }));

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
};