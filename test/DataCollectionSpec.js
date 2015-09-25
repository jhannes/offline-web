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
            expect(toArray(db.objectStoreNames)).to.contain('talks');
        });
    });

    describe('use collection', function() {
        var collection;

        before(function(done) {
            appDataCollection.open().then(function(db) {
                collection = new Collection(db, 'talks');
            }).then(function() {
                collection.clear();
            }).then(done, done);
        });

        it('can return saved data', function() {
            var talk = { title: 'the title' };
            return collection.save(talk).then(function(talk) {
                return collection.get(talk.id);
            }).then(function(talk) {
                expect(talk.title).to.equal('the title');
            });
        });

        it('initializes data', function() {
            var talk = { title: 'the title' };
            return collection.save(talk).then(function(talk) {
                return collection.get(talk.id);
            }).then(function(talk) {
                expect(talk.id).to.match(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/);
                expect(talk.createdAt).to.be.a('Date');
            });
        });

        it('can list all data', function() {
            var talk = { title: 'listed title' };
            return collection.save(talk).then(function() {
                return collection.list('by_createdAt');
            }).then(function(talks) {
                expect(talks.map(function(t) { return t.title; })).to.contain('listed title');
            });
        });

        it('can delete all data', function() {
            var talk = { title: 'talk to be deleted' };
            return collection.save(talk).then(function() {
                return collection.clear();
            }).then(function() {
                return collection.list('by_createdAt');
            }).then(function(talks) {
                expect(talks).to.be.empty;
            });
        });

        it('sends event on save', function(done) {
            var talk = { title: 'talk to be inserted' };

            collection.on('insert', function(newEntry) {
                expect(newEntry.title).to.equal('talk to be inserted');
                done();
            });

            collection.save(talk);
        });
    });

});

