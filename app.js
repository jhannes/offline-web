'use strict';
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(require('morgan')('dev'));
app.use(express.static('public'));
app.use(bodyParser.json());

var eventSources = [];
var talks = {};

app.post('/talks', function(req, res) {
    talks[req.body.id] = req.body;
    res.status(200).end();

    eventSources.forEach(function(eventSource) {
        eventSource.write("event: insert\n");
        eventSource.write("id: " + req.body.id + "\n");
        eventSource.write("data: " + JSON.stringify(req.body) + "\n\n");
    });
});

app.get('/talks/events', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });
    res.write('\n');

    eventSources.push(res);
});

module.exports = app;

