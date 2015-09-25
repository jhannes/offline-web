'use strict';
var express = require('express');

var app = express();

//app.use(logger);
app.use(require('morgan')('dev'));
app.use(express.static('public'));

module.exports = app;

