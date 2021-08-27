const EventEmitter = require('events');
var Message = require('./MessageClass');
class User extends EventEmitter {
    constructor(userId) {
        super(); // why?
        this.userId = userId;
        this.messages = [];
        this.lastReadMessageIndex = 0;
    }

    writeNewMessage(newMessage) {
        let message = new Message(newMessage);
        this.messages.push(message);

        // send message to active subscribers
        this.emit('newMessage', message);
    }
}

module.exports = User;
