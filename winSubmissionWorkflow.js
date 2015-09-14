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
        compiler.send({ 'sourceFilePath': message.srcFilePath, userCodeStartLine: message.userCodeStartLine });

        compiler.on('message', function (message) {

            if (message.compileSuccess) {
                // Run Test Cases
                var tcExecutor = child_process.fork(__dirname + '/testCaseExecutor.js');
                tcExecutor.send({ exeFilePath: message.exeFilePath, prob: prob });

                tcExecutor.on('exit', function () {
                    // console.log("Executor EXITED");
                });

                tcExecutor.on('close', function () {
                    // console.log("Executor Closed");
                });

                tcExecutor.on('message', function (message) {
                    message.compileSuccess = true;
                    process.send(message);
                });
            }
            else {
                process.send(message);
            }
        });
    });

});