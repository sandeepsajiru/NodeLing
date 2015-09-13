var sh = require('child_process');
var path = require("path");
var endOfLine = require('os').EOL;

function prepareCompileErrorStr(compileError, userCodeStartLine) {
    var errorLine = compileError.split(endOfLine);
    var newErrorStr = '';
    errorLine.forEach(
        function process(val) {
            var idx = -1;
            if((idx=val.indexOf(".c:"))!=-1)
                val = val.substring(idx + 3) + endOfLine;
            if ((idx = val.indexOf(".exe:")) != -1)
                val = val.substring(idx + 5) + endOfLine;

            var lineNumber = Number(val.substring(0, val.indexOf(":")));
            if (!isNaN(lineNumber) && lineNumber > 0) {
                lineNumber -= userCodeStartLine-1;
                newErrorStr += lineNumber + val.substring(val.indexOf(":"));
            }
            else {
                newErrorStr += val;
            }
        }
    );
    return newErrorStr;
}

process.on('message', function (message) {
    var sourceFilePath = message.sourceFilePath;
    var srcDirPath = path.dirname(sourceFilePath);
    var extension = path.extname(sourceFilePath);
    var fileNameWithoutExt = path.basename(sourceFilePath, extension);
    var destinationFilePath = path.join(srcDirPath, fileNameWithoutExt + ".exe");

    var cmdLine = "mingw32-gcc.exe -Wall -Werror " + sourceFilePath + " -o " + destinationFilePath;

    sh.exec(cmdLine, function (error, stdout, stderr) {
        if (error !== null) {
            console.log(stderr);
            var errStr = prepareCompileErrorStr(stderr,message.userCodeStartLine);
            process.send({
                compileSuccess: false,
                error: errStr
            });
            process.exit();
        } else {
            process.send({
                compileSuccess: true,
                exeFilePath: destinationFilePath
            });
            process.exit();

        }
    })
});

//mingw32-gcc.exe   -c C:\Users\Sandy\Desktop\CPS-6\LinkedList\main.c -o C:\Users\Sandy\Desktop\CPS-6\LinkedList\main.o
//mingw32-g++.exe  -o C:\Users\Sandy\Desktop\CPS-6\LinkedList\main.exe C:\Users\Sandy\Desktop\CPS-6\LinkedList\main.o

// SINGLE STEP
// mingw32-gcc.exe tmpSrc\tmp-9356ZKndI9y3BJjS.c -o tmpSrc\main.exe