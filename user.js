const EventEmitter = require('events');
var Message = require('./message');
const { exists } = require('fs');

// User
// name
// password (optional for now)
// createdDate
// lastLogin
// userId
// sessionId
// getMessages(user) - order by created date
// Let messages = messageStore.filter( (createdBy === this.name && touser=== user.name) || (createdBy === user..name && touser=== this.name) )
// writeMessage(message, toUser) [can expand this to forumId or pageId instead of userId]
// user creates a new Message(message) and store into Messages where userId === Messages.userId
// deleteMessage(messageId)  *optional*
// user deletes a message
// editMessage(messageId, message) *optional*
// user edits an existing message
// login()
// logout()

class User extends EventEmitter {
    constructor(id) {
        super();
        if (User.exists(id)) {
            throw 'username already exists';
        }

        this.id = id;
        this.password = id; // update later
        this.createdDate = Date.now();
        this.lastLogin = this.createdDate; // start as this update later
        this.sessionId;
        this.messages = [];
        this.lastReadMessageIndex = 0;
        User.userStore[id] = this;
    }

    static userStore = {};

    static exists(id) {
        return User.userStore.hasOwnProperty(id);
    }

    getMessages(toUser) {
        let messages = Message.messageStore.filter((message) => {
            let messageSentFromMe = (message.createdBy === this.id && message.toUser === toUser);
            let messageSentToMe = (message.toUser === this.id && message.createdBy === toUser);
            return messageSentFromMe || messageSentToMe;
        })
        return messages;
    }

    writeNewMessage(newMessage, toUserId) {
        // user creates a new Message(message) and store into Messages where userId === Messages.userId
        let message = new Message(newMessage, this.id, toUserId);
        Message.messageStore.push(message);
        if (toUserId !== this.id) {
            let toUser = User.userStore[toUserId];
            toUser.emit('newMessage', message);
            toUser.messages.push(message);
        }
        // send message to active subscribers
        this.emit('newMessage', message);
        this.messages.push(message);
    }
}

module.exports = User;
