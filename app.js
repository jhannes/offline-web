'use strict';
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(express.static('public'));
app.use(bodyParser.json());

var eventSources = [];
var talks = {};

var Datastore = require('nedb');
var db = new Datastore({ filename: 'db/talks.json' });

db.loadDatabase(function(err) {    // Callback is optional
    app.post('/talks', function(req, res) {
        var talk = req.body;
        talk._id = talk.id;
        talks[talk.id] = talk;
        res.status(200).end();

        db.insert(talk);

        eventSources.forEach(function(eventSource) {
            eventSource.write('event: insert\n');
            eventSource.write('id: ' + req.body.id + '\n');
            eventSource.write('data: ' + JSON.stringify(req.body) + '\n\n');
        });
    });

    app.get('/talks/events', function(req, res) {
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

