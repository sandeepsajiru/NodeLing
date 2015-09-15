var cp = require("child_process");
var endOfLine = require('os').EOL;

process.on('message', function (message) {
    var exeFilePath = message.exeFilePath;
    var testCases = message.prob.testCases;
    var tcTotalExecuted = 0;
    var jsonOutput = [];
    testCases.forEach(
            function executeTestCase(testCase) {
                var proc = cp.exec(exeFilePath, { killSignal: 'SIGKILL', timeout: "10000" }, function (error, stdout, stderr) {
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
                        if (stdout === testCase.expectedOutput) {
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