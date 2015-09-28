'use strict';
var app = require('./app');
app.use(require('morgan')('dev'));

var server = app.listen(process.env.port || 3000, function() {
    console.log(server.address());
});

