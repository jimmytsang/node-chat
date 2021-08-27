const express = require('express');
const app = express();
const path = require('path');
const PORT = 3000;
const bodyParser = require('body-parser')
var User = require('./UserClass.js');

var globalMessageStore = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/index.html'));
});

app.get('/workloadgroup-policies', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/workloadgroup-policies.html'));
});

function createUser(userId) {
    if (!globalMessageStore[userId]) {
        globalMessageStore[userId] = new User(userId);
    }
};

// create user, returns json of messages to the client
// subscribe to server to return messages when global message store populates
app.get('/longpolling', function(req, res) {
    var user;
    var messages;
    var userId = req.query.userId;
    var lastReadMessageIndex;

    userId = 'Jimmy';

    createUser(userId);
    user = globalMessageStore[userId];
    lastReadMessageIndex = req.query.lastReadMessageIndex || 0;

    let newMessageCb = (newMessage) => {
        // TODO: alert other users that there is a new message!
        res.json({ messages: [newMessage] });
    };

    // return only unread messages
    messages = user.messages.slice(lastReadMessageIndex);

    if (messages.length > 0) {
        res.json({ messages: messages });
    } else { 
        // subscribes this user to new messages
        user.once('newMessage', newMessageCb);
        req.on('close', function() {
            user.removeListener('newMessage', newMessageCb);
        });
    }
});

// populates everyone's messages in global message store 
// if active subscribers, return json of messages to the subscriber
app.post('/sendchat', function(req, res) {
    let message = req.body.message;
    // write new message to all users
    Object.keys(globalMessageStore).forEach(userId => {
        globalMessageStore[userId].writeNewMessage(message);
    });
    return res.redirect('/');
});

app.listen(PORT, function() {
    console.log('Server is running on PORT:',PORT);
});
