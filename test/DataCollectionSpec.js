/* globals appDataCollection, Collection, expect */
/* jshint expr: true */

function toArray(obj) {
    'use strict';

    var array = [];

    // iterate backwards ensuring that length is an UInt32
    for (var i = obj.length >>> 0; i--;) {
        array[i] = obj[i];
    }

    return array;
}

describe('data collection', function() {
    'use strict';

    it('opens database', function() {
        return appDataCollection.open().then(function(db) {
            expect(toArray(db.objectStoreNames)).to.contain('chatCollection');
        });
    });

    describe('with collection', function() {
        var collection;

        before(function() {
            return appDataCollection.open().then(function(db) {
                collection = new Collection(db, 'chatCollection');
            }).then(function() {
                return collection.clear();
            });
        });

        it('can return saved data', function() {
            var chat = { title: 'the title' };
            return collection.save(chat).then(function(chat) {
                return collection.get(chat.id);
            }).then(function(chat) {
                expect(chat.title).to.equal('the title');
            });
        });

        it('initializes data', function() {
            var chat = { title: 'the title' };
            return collection.save(chat).then(function(chat) {
                return collection.get(chat.id);
            }).then(function(chat) {
                expect(chat.id).to.match(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/);
                expect(chat.createdAt).to.be.a('Date');
            });
        });

        it('can list all data', function() {
            var chat = { title: 'listed title' };
            return collection.save(chat).then(function() {
                return collection.list('by_createdAt');
            }).then(function(chats) {
                expect(chats.map(function(t) { return t.title; })).to.contain('listed title');
            });
        });

        it('can delete all data', function() {
            var chat = { title: 'chat to be deleted' };
            return collection.save(chat).then(function() {
                return collection.clear();
            }).then(function() {
                return collection.list('by_createdAt');
            }).then(function(chats) {
                expect(chats).to.be.empty;
            });
        });

        it('lists transmitted items', function() {
            var transmitted = { title: 'chat transmitted successfully', transmittedAt: new Date() };
            var failed = { title: 'chat where transmission failed' };

            return Promise.all([
                collection.save(failed), collection.save(transmitted),
            ]).then(function() {
                return collection.list('by_transmittedAt', 'never');
            }).then(function(chats) {
                expect(chats.map(function(t) { return t.title; }))
                    .to.contain(failed.title)
                    .and.not.contain(transmitted.title);
            });
        });

        it('updates items', function() {
            var chat = { title: 'chat to be transmitted' };
            return collection.save(chat).then(function() {
                chat.transmittedAt = new Date();
                return collection.save(chat);
            }).then(function() {
                return collection.list('by_transmittedAt', 'never');
            }).then(function(chats) {
                expect(chats.map(function(t) { return t.title; }))
                    .to.not.contain(chat.title);
            });
        });
    });

    it('sends event on save', function(done) {
        var chat = { title: 'chat to be inserted' };

        appDataCollection.open().then(function(db) {
            var collection = new Collection(db, 'chatCollection');

            collection.on('change', function(newEntry) {
                expect(newEntry.title).to.equal('chat to be inserted');
                done();
            });

            return collection;
        }).then(function(collection) {
            collection.save(chat);
        });
    });

    it('sends event on updates', function(done) {
        var chat = { title: 'chat to be updated' };
        var collection;

        appDataCollection.open().then(function(db) {
            collection = new Collection(db, 'chatCollection');
        }).then(function() {
            return collection.save(chat);
        }).then(function() {
            collection.on('change', function(newEntry) {
                expect(newEntry.transmittedAt).to.not.be.null;
                done();
            });

            return collection;
        }).then(function(collection) {
            chat.transmittedAt = new Date();
            collection.save(chat);
        });
    });

});

