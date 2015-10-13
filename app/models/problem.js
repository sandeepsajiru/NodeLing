var mongoose = require('mongoose');

var problemSchema = mongoose.Schema({
    id: String,
    title: String,
    description: String,
    example: String,
    language: String,
    section: String,
    explaination: String,
    testCases: [
	{
	    id: String,
	    desc: String,
	    input: String,
	    expectedOutput: String,
	    actualOutput: String
	}],
    instructorCode: String,
    userCode: String,
    solutionCode: String
}
);

module.exports = mongoose.model('problemModel', problemSchema);