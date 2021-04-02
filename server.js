const express = require('express');
const app = express();
const path = require('path');
const PORT = 3000;

var globalMessageStore = {
    userId: {
        messages: []
        // messages : {
            // messageId: "",
            // onNewMessage: () => {},
            // listeners of my messages
            // event when i emit new messages
            // how to create an evented object
            // how to extend class in node with events
        // }
    }
};

function createUser(userId) {
    if (!globalMessageStore[userId]) {
        globalMessageStore[userId] = {
            messages: []
        };
    }
};

app.set('views', path.join(__dirname, 'views'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/index.html'));
});

// create user
// returns json of messages to the client
// subscribe to server to return messages when global message store populates
app.get('/longpolling', function(req, res) {
    var messages;
    var userId = req.query.userId;
    var lastMessageIndex = req.query.lastMessageIndex || -1;

    createUser(userId);
    messages = globalMessageStore[userId].messages;

    // return only unread messages
    if (lastMessageIndex > -1) {
        messages = messages.slice(lastMessageIndex + 1);
    }

    if (messages.length > 0) {
        return res.json({ messages: messages });
    }
    // subscribe to server awaiting server response from /sendchat
    globalMessageStore[userId].res = res;
});

// populates everyone's messages in global message store 
// if active subscribers, return json of messages to the subscriber
app.get('/sendchat', function(req, res) {
    let message = req.query.message;
    // push message to all users
    Object.keys(globalMessageStore).forEach(userId => {
        globalMessageStore[userId].messages.push(message);
        
        // send json of message to active subscribers
        let res = globalMessageStore[userId].res
        if (res && !res.writableFinished) {
            delete globalMessageStore[userId].res;
            return res.json({ messages: [message] });
        }
    });
    return res.json({status: 'OK'});
});

app.listen(PORT, function() {
    console.log('Server is running on PORT:',PORT);
});
