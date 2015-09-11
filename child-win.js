var Sync = require('sync');
var fs = require('fs');
var sh = require('child_process');
var targetSource;
var targetExe;
var targetInput;
var fileName;
var cmdLine;
process.on('message', function (message) {
    // Process data
    Sync(function () {
        fileName = "test";//+ message.id;
        targetSource = __dirname + "/scripts/" + fileName + ".java";
        targetExe = "scripts/exe/" + fileName + ".exe";
        targetInput = __dirname + "/scripts/input/" + fileName + ".txt";
        fs.writeFile(targetSource, message.script, function (err) {
            fs.writeFile(targetInput, message.inputs, function (err) {
                Sync(function () {
                    cmdLine = "javac " + targetSource;
                    var result =
                        sh.exec(
                            cmdLine,
                            function (error, stdout, stderr) {
                                if (error !== null) { //Compilation Error
                                    //console.log('exec error: ' + error);
                                    process.send({ error: stderr, success: false, id: message.id });
                                } else { // Compilation Succeeded
                                    Sync(function () {
                                        console.log('exec stdout: ' + stdout);
                                        cmdLine = "java -cp scripts " + fileName + " < " + targetInput;
                                        var start = new Date().getTime();
                                        var result2 =
                                            sh.exec(
                                                cmdLine,
                                                function (error, stdout, stderr) {
                                                    if (error !== null) { // Execution Error
                                                        //console.log('exec error: ' + error);
                                                        process.send({ error: stderr, success: false, id: message.id });
                                                    } else { // Execution Succeedeed
                                                        var end = new Date().getTime();
                                                        var time = end - start;
                                                        process.send({ result: stdout, timeExec: time, success: true, id: message.id });

                                                    } //else
                                                } // callback function - sh.exec java
                                            ); //sh.exec
                                    }); //Sync
                                } //else                                   
                            } // callback function - sh.exec javac
                        ); //sh.exec	          
                }); //Sync
            });
        });
    });
});