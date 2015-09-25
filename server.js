'use strict';
var app = require('./app');

var server = app.listen(process.env.port || 3000, function() {
    console.log(server.address())
});

