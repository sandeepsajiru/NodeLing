var tmp = require('tmp');
var multiline = require("multiline");
var fs = require('fs');
var endOfLine = require('os').EOL;

var tmpobj = tmp.fileSync({postfix:'.c', keep:'true'});
var outputFilePath ='';
// generate Unique output File Path 
outputFilePath = tmpobj.name;

var masterCode1 =multiline(function(){/*
#include <stdio.h>
#include <stdlib.h> 
%USER_CODE% 
int main() 
{ 
    int n; 
    scanf("%d", &n); 
    printf("%d", factorial(n)); 
    return 0; 
}
*/
});

process.on('message', function(message){
    
    var masterCode = message.prob.instructorCode;
    var linesOfCode = masterCode.split(endOfLine);
    var c = 0;
    for (i = 0; i < linesOfCode.length; i++) {
        c++;
        if (linesOfCode[i].indexOf("%USER_CODE%")!=-1) {
            break;
        }
    }
    
    // masterCode - Replace - %USER_CODE% with string value of userCode
	var mergedCode = masterCode.replace("%USER_CODE%", message.userCode);
	console.log(mergedCode);

	fs.writeFile(outputFilePath, mergedCode, function(err) {
		if(err) {
			return console.log(err);
		}
	process.send({srcFilePath : outputFilePath, userCodeStartLine: c});
	console.log("The file was saved!");
	process.exit();
})
}); 


// If we don't need the file anymore we could manually call the removeCallback 
// But that is not necessary if we didn't pass the keep option because the library 
// will clean after itself. 
// tmpobj.removeCallback();



