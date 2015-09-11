var exeFilePath = 'magicsquare.exe';
var tcFilePath = 'tc_magicsquare.txt';
var cp = require("child_process");
var endOfLine = require('os').EOL;
// var kill = require('tree-kill');

process.on('message', function (message) {
    exeFilePath = message.exeFilePath;
    tcFilePath = message.tcFilePath;

    var tcTotalExecuted = 0;
    var testCases = message.prob.testCases;
    var jsonOutput = [];
    testCases.forEach(
            function executeTestCase(testCase) {
                var proc = cp.execFile(exeFilePath, { killSignal: 'SIGKILL', timeout: "10000" }, function (error, stdout, stderr) {
                    if (error) {
                        jsonOutput.push({
                            testCase: testCase,
                            result: "Failed",
                            extra: "TIME_LIMIT_EXCEEDED"
                        });

                    } else if (stderr !== "") {
                        jsonOutput.push({
                            testCase: testCase,
                            result: "Failed",
                            extra: "STDERR" + stderr
                        });

                    } else {
                        if (stdout === testCase.output) {
                            jsonOutput.push({
                                testCase: testCase,
                                result: "Passed"
                            });
                        }
                        else {
                            jsonOutput.push({
                                testCase: testCase,
                                result: "Failed"
                            });
                        }
                    }

                    tcTotalExecuted++;

                    // Send result only when execution for all testcases completes.
                    if (tcTotalExecuted == testCases.length) { // All testcases got executed.
                        process.send({ testCaseResults: jsonOutput });
                        process.exit();
                    }
                });

                // Pass test case input by writing it on stdin.
                proc.stdin.write(testCase.input);
                proc.stdin.end();
            }
    );
});