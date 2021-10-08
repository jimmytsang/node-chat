// Message (subclass of channel)
// createdBy - fromUser
// toUser - User
// message string
// createdDate
// read Boolean (optional)
// messageId (do we actually need this since we have time stamp?)
// encodingType

var User = require('./user');

class Message {
    constructor(message, fromUser, toUser) {
        this.createdBy = fromUser;
        this.toUser = toUser;
        this.message = message;
        this.createdDate = Date.now();
        this.messageId = this.createdDate;
        this.encodingType = 'GSM-7';
    }

    static messageStore = [];

}

module.exports = Message;