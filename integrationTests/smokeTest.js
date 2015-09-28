/* jshint mocha: true */
'use strict';

var selenium = require('selenium-standalone');

var webdriverio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'chrome' } };

var expect = require('chai').expect;

describe('offline synchronized server', function() {

    var client1, client2, seleniumServer;

    before(function() {
        this.timeout(20000);
        var server;
        var seleniumStart = new Promise(function(resolve, reject) {
            seleniumServer = selenium.start({}, function(e, server) {
                if (e) reject(e);
                else resolve(server);
            });
        });
        var serverStart = new Promise(function(resolve, reject) {
            var app = require('../app');
            server = app.listen(0, function() {
              resolve(server.address());
            });
        });

        return Promise.all([serverStart, seleniumStart]).then(function(res) {
            var address = res[0];
            seleniumServer = res[1];
            client1 = webdriverio.remote(options).init().url('http://localhost:' + server.address().port);
            return client1;
        }).then(function() {
            client2 = webdriverio.remote(options).init().url('http://localhost:' + server.address().port);
            return client2;
        });
    });

    after(function(done) {
        this.timeout(5000);
        Promise.all([client1.end(), client2.end()])
        .then(function() {
            seleniumServer.kill();
            done();
        });
    });


    it('shows events posted in one browser in another', function() {
        this.timeout(10000);
        return client1
            .setValue('#event_name', 'new talk')
            .submitForm('#event_name')
            .waitForVisible('#eventList li', 2000)
            .getText('#eventList li')
            .then(function(text) {
                expect(text).to.contain('new talk');

                return client2
                    .waitForVisible('#eventList li', 2000)
                    .getText('#eventList li')
            }).then(function(text) {
                expect(text).to.contain('new talk');
            });
    });
});
