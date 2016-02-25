var mongoose = require('mongoose');

var submissionSchema = mongoose.Schema({
    id: String,
    userid: String,
    script: String,
    problemid: String,
    dateTime: String,
	verdict:String //TODO: Make it per test.
}
);

module.exports = mongoose.model('submissionModel', submissionSchema);