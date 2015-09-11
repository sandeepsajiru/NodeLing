//mingw32-gcc.exe   -c C:\Users\Sandy\Desktop\CPS-6\LinkedList\main.c -o C:\Users\Sandy\Desktop\CPS-6\LinkedList\main.o
//mingw32-g++.exe  -o C:\Users\Sandy\Desktop\CPS-6\LinkedList\main.exe C:\Users\Sandy\Desktop\CPS-6\LinkedList\main.o

// SINGLE STEP
// mingw32-gcc.exe tmpSrc\tmp-9356ZKndI9y3BJjS.c -o tmpSrc\main.exe
var sh = require('child_process');
var path = require("path");
	
var sourceFilePath=__dirname+'\\tmpSrc\\tmp-9356ZKndI9y3BJjS.c';
var destinationFilePath=__dirname+'\\tmpSrc\\tmp-9356ZKndI9y3BJjS.exe';
process.on('message', function(message){
	sourceFilePath = message.sourceFilePath;
	
	//TODO:  Generate Destination file Path
	var srcDirPath = path.dirname(sourceFilePath);
	var extension = path.extname(sourceFilePath);
	var fileNameWithoutExt = path.basename(sourceFilePath,extension);
	destinationFilePath = path.join(srcDirPath, fileNameWithoutExt+".exe");

	var cmdLine = "mingw32-gcc.exe " + sourceFilePath+" -o "+destinationFilePath;
	sh.exec(cmdLine, function (error, stdout, stderr) {
		if (error !== null)
		{	 
			console.log("ERROR: "+error.toString());
			console.log("STDERR: "+stderr);
		}else{
		console.log("STDOUT: "+stdout);
		console.log("compiled to "+destinationFilePath);
		
		process.send({ exeFilePath: destinationFilePath });
		process.exit();
		
		}
	})
});