var tmp = require('tmp');
var path = require('path');
var fs = require('fs');
var endOfLine = require('os').EOL;

var codeFolder = 'c:\\java';

process.on('message', function (message) {
    var fileExt = '';
    switch (message.prob.language.toLowerCase()) {
        case "c":
            fileExt = '.c';
            dirPrefix = 'cTempFolder_';
            break;
        case "java":
            fileExt = '.java';
            dirPrefix = 'javaTempFolder_';
            break;
        default:
            fileExt = '.c';
            dirPrefix = 'cTempFolder_';
    }

    // Generate Unique output File Path. 
    var codeFolderObj = tmp.dirSync({ prefix: dirPrefix, dir: codeFolder, keep: 'true' });
    var outputFilePath = path.join(codeFolderObj.name, 'Test' + fileExt);

    var masterCode = message.prob.instructorCode;
    var linesOfCode = masterCode.split(endOfLine);
    var lineNumber = 0;
    for (i = 0; i < linesOfCode.length; i++) {
        lineNumber++;
        if (linesOfCode[i].indexOf("%USER_CODE%") != -1) {
            break;
        }
    }

    // masterCode - Replace - %USER_CODE% with string value of userCode
    var mergedCode = masterCode.replace("%USER_CODE%", message.userCode);
    fs.writeFile(outputFilePath, mergedCode, function (err) {
        if (err) {
            return console.log(err);
        }
        process.send({
            srcFilePath: outputFilePath,
            userCodeStartLine: lineNumber
        });
        process.exit();
    });
});


// If we don't need the file anymore we could manually call the removeCallback 
// But that is not necessary if we didn't pass the keep option because the library 
// will clean after itself. 
// tmpobj.removeCallback();



