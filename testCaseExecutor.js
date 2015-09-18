var cp = require("child_process");
var endOfLine = require('os').EOL;
function matchStrings(str1, str2)
{
	str1 = str1.trim();
	str2 = str2.trim();
	console.log(str1.toUpperCase());
	console.log(str2.toUpperCase());
	return (str1.toUpperCase()==str2.toUpperCase());
}
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
                            actualOutput: "TIME_LIMIT_EXCEEDED"
                        });

                    } else if (stderr !== "") {
                        jsonOutput.push({
                            testCase: testCase,
                            result: "Failed",
                            actualOutput: "STDERR" + stderr
                        });

                    } else {
                        if (matchStrings(stdout,testCase.expectedOutput)) {
                            jsonOutput.push({
                                testCase: testCase,
                                actualOutput: stdout,
                                result: "Passed"
                            });
                        }
                        else {
                            jsonOutput.push({
                                testCase: testCase,
                                actualOutput: stdout,
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
				console.log(testCase.input);
                proc.stdin.write(testCase.input);
                proc.stdin.end();                
            }
    );
});