/* exported appDataCollection */
/* globals indexedDB */

function requestToPromise(operation) {
    'use strict';
    return new Promise(function(resolve, reject) {
        var request = operation();
        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function(e) {
            reject(e.target.error);
        };
    });
}

function Collection(db, storeName) {
    'use strict';
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
        item.id = item.id || guid();
        item.createdAt = item.createdAt || new Date();
        item.transmittedAt = item.transmittedAt || 'never';
        return requestToPromise(function() {
            return storeInTx('readwrite').put(item);
        }).then(function() {
            listeners.change.forEach(function(fn) {
                fn(item);
            });
        }).then(function() {
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

    this.list = function(index, keyRange) {
        return new Promise(function(resolve, reject) {
            var cursor = storeInTx().index(index).openCursor(keyRange);
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
        change: [],
        delete: [],
    };

    this.on = function(event, fn) {
        listeners[event].push(fn);
    };
}

var appDataCollection = (function() {
    'use strict';
    function open() {
        return requestToPromise(function() {
            var openRequest = indexedDB.open('my_app_db', 1);

            openRequest.onupgradeneeded = function(e) {
                console.log('upgrade', e.oldVersion, e.newVersion);
                var db = openRequest.result;
                if (e.oldVersion < 1) {
                    var store = db.createObjectStore('chatCollection', { keyPath: 'id' });
                    store.createIndex('by_createdAt', 'createdAt', {unique: false});
                    store.createIndex('by_transmittedAt', 'transmittedAt', {unique: false});
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
