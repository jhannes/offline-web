/* exported appDataCollection */
/* globals indexedDB */
'use strict';

function requestToPromise(operation) {
    return new Promise(function(resolve, reject) {
        var request = operation();
        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function(e) {
            reject(e);
        };
    });
}

function Collection(db, storeName) {
    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16).substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    function storeInTx(mode) {
        mode = mode || 'readonly';
        return db.transaction([storeName], mode).objectStore(storeName);
    }

    this.save = function(item) {
        return requestToPromise(function() {
            item.id = guid();
            item.createdAt = item.createdAt || new Date();
            return storeInTx('readwrite').put(item);
        }).then(function(result) {
            listeners.insert.forEach(function(fn) {
                fn(item);
            });

            return item;
        });
    };

    this.get = function(id) {
        return requestToPromise(function() {
            return storeInTx().get(id);
        });
    };

    this.clear = function() {
        return requestToPromise(function() {
            return storeInTx('readwrite').clear();
        });
    };

    this.list = function(index) {
        return new Promise(function(resolve, reject) {
            var cursor = storeInTx().index(index).openCursor();
            var result = [];
            cursor.onsuccess = function(e) {
                if (e.target.result) {
                    result.push(e.target.result.value);
                    e.target.result.continue();
                } else {
                    resolve(result);
                }
            };

            cursor.onerror = reject;
        });
    };

    var listeners = {
        insert: [],
        update: [],
        delete: [],
    };

    this.on = function(event, fn) {
        listeners[event].push(fn);
    };
}

var appDataCollection = (function() {
    function open() {
        return requestToPromise(function() {
            var openRequest = indexedDB.open('my_app_db', 1);

            openRequest.onupgradeneeded = function(e) {
                console.log('upgrade', e.oldVersion, e.newVersion);
                var db = openRequest.result;
                if (e.oldVersion < 1) {
                    var store = db.createObjectStore('talks', { keyPath: 'id' });
                    store.createIndex('by_createdAt', 'createdAt', {unique: true});
                }
            };

            return openRequest;
        });
    }

    return {
        open: open,
        collection: Collection,
    };
})();
