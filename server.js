const express = require('express');
const cookieParser = require('cookie-parser')
const app = express();
const path = require('path');
const PORT = 3000;
const bodyParser = require('body-parser')
const mustacheExpress = require('mustache-express');
var User = require('./user.js');

global.messageStore = {};
global.userStore = {};

app.use(cookieParser());

// Dangerous bodyparser
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('html', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', function(req, res) {
    res.render('login.html', {hello: 'hello mustache'});
});

app.post('/login', function(req, res) {
    let userId = req.body.userId;
    if (!User.exists(userId)) {
        createUser(userId);
    }
    res.cookie('userId', userId);
    return res.redirect('/?userId=' + userId);
});

app.use(function(req, res, next) {
    if (!req.cookies.userId) {
        res.redirect(302, '/login');
    } else {
        next()
    }
});

// goal: mozilla firefox and chrome different users talk to each other

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/index.html'));
});

function createUser(userId) {
    if (!User.exists(userId)) {
        User.userStore[userId] = new User(userId);
    }
};

// create user, returns json of messages to the client
// subscribe to server to return messages when global message store populates
app.get('/longpolling', function(req, res) {
    var user;
    var messages;
    var userId = req.cookies.userId;
    var lastReadMessageIndex;

    if (!userId) {
        // Question: why is this not redirecting to /login?
        res.redirect(302, '/login');
    } else {
        if (userId && !User.exists(userId)) {
            createUser(userId);
        }
        user = User.userStore[userId];
        lastReadMessageIndex = req.query.lastReadMessageIndex || 0;

        let newMessageCb = (newMessage) => {
            // Later Problem: alert other users that there is a new message!
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

// populates everyone's messages in global message store 
// if active subscribers, return json of messages to the subscriber
app.post('/sendchat', function(req, res) {
    let userId = req.cookies.userId;
    let toUserId = req.body.toUserId;
    let message = req.body.message;
    let user = User.userStore[userId];

    if (User.exists(toUserId)) {
        user.writeNewMessage(message, toUserId);
    } else {
        throw 'the user you are writing to does not exist';
    }

    return res.redirect('/');
});

app.listen(PORT, function() {
    console.log('Server is running on PORT:',PORT);
});
