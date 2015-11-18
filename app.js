'use strict';
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(express.static('public'));
app.use(bodyParser.json());

var eventSources = [];
var chats = {};

var Datastore = require('nedb');
var db = new Datastore({ filename: 'db/chats.json' });

db.loadDatabase(function(err) {    // Callback is optional
    app.post('/chats', function(req, res) {
        var chat = req.body;
        chat._id = chat.id;
        chats[chat.id] = chat;
        res.status(200).end();

        db.insert(chat);

        eventSources.forEach(function(eventSource) {
            eventSource.write('event: insert\n');
            eventSource.write('id: ' + req.body.id + '\n');
            eventSource.write('data: ' + JSON.stringify(req.body) + '\n\n');
        });
    });

    app.get('/chats/events', function(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        });
        res.write('\n');

        db.find({}).sort({createdAt: -1}).limit(1).exec(function(err, tail) {
            if (tail.length > 0) {
                res.write('event: start\n');
                res.write('data: ' + JSON.stringify({tail: tail[0].createdAt}) + '\n\n');                
            }
        });

        eventSources.push(res);
    });
});

module.exports = app;

