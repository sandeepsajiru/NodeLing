var child_process = require('child_process');
var res = "";

process.on('message', function (message) {
    
    var codeMerger = child_process.fork(__dirname + '/codeMerger.js');
    codeMerger.send({ userCode: message.data, prob: message.prob });
    var prob = message.prob;
    codeMerger.on('message', function (message) {
        // console.log("CodeMerger Sent: " + message.srcFilePath);

        //TODO:  Make it generic to invoke any compiler  C, Java, Python
        var compiler = child_process.fork(__dirname + '/cCompiler.js', [], { killSignal: 'SIGKILL', timeout: "20000" });
        compiler.send({ 'sourceFilePath': message.srcFilePath });

        compiler.on('message', function (message) {
            // console.log("Compiler Sent: " + message.exeFilePath);

            // Run Test Cases
            var tcExecutor = child_process.fork(__dirname + '/testCaseExecutor.js');
            tcExecutor.send({ exeFilePath: message.exeFilePath, tcFilePath: __dirname + "\\tc_factorial.txt", prob: prob });

            tcExecutor.on('exit', function () {
                // console.log("Executor EXITED");
            });

            tcExecutor.on('close', function () {
                // console.log("Executor Closed");
            });

            tcExecutor.on('message', function (message) {
                console.log(message);
                process.send(message);
            });
        });
    });

});