const express = require('express');
const app = express();
const path = require('path');
const PORT = 3000;
const bodyParser = require('body-parser')
var User = require('./user.js');

global.messageStore = {};
global.userStore = {};

app.use(bodyParser.urlencoded({ extended: true }));
// app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

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
    var userId = req.params.userId;
    var lastReadMessageIndex;

    // TODO: user needs to login before entering chat interface
    // app needs to ask for username
    if (!userId) {
        // Ask Matt why is this not redirecting to /login?
        return res.redirect('/login');
    } else {
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
    }
});

app.get('/login', function(req, res) {



    // GOAL: before loading intial page, get user to login with username then display username in chat page
    // Figure out why long polling route doesn't redirect to login
    // Figure out send login to server
        // 1. create user if username doesnt exist
        // 2. pass username variable to index.html (how? Does this require templating engine?)
    // Figure out how to pass variables to html files look into templating engine



    let loginPagePath = path.join(__dirname + '/views/login.html')
    return res.sendFile(loginPagePath);
});

// populates everyone's messages in global message store 
// if active subscribers, return json of messages to the subscriber
app.post('/sendchat', function(req, res) {
    let userId = req.body.userId;
    let message = req.body.message;
    // write new message to all users
    Object.keys(globalMessageStore).forEach(userKey => {
        globalMessageStore[userKey].writeNewMessage(message + ` - from ${userId}`);
    });
    // question for jimmy, do we need to redirect and refresh the page?
    return res.redirect('/');
});

app.post('/login', function(req, res) {
    let username = req.body.username;
    if (!globalMessageStore[username]) {
        createUser(username);
    }
    return res.status(200).send(`<div>hello ${username}</div>`);
});

app.listen(PORT, function() {
    console.log('Server is running on PORT:',PORT);
});
