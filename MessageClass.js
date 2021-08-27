class MessageClass {
    constructor(message) {
        this.messageText = message;
        this.timeStamp = Date.now();
    }
}

module.exports = MessageClass;