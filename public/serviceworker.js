/* globals caches, fetch */

self.addEventListener('install', function(e) {
    'use strict';
    e.waitUntil(
    caches.open('offlineweb-cache-v1').then(function(cache) {
        return cache.addAll([
          '/',
          '/index.html',
          '/js/dataCollection.js',
          '/vendor/es6-promise.js',
          '/vendor/EventSource.js',
          '/vendor/jquery-1.11.3.js',
          'vendor/handlebars-v4.0.2.js',
          '/images/johannes-icon.jpg',
      ]).then(function() {
          return self.skipWaiting();
      });
    })
  );
});

self.addEventListener('activate', function(event) {
    'use strict';
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
    'use strict';

    event.respondWith(
    caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
    })
  );
});
