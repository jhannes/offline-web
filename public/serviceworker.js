/* globals caches, fetch */
'use strict';

self.addEventListener('install', function(e) {
    e.waitUntil(
    caches.open('offlineweb-cache-v1').then(function(cache) {
        return cache.addAll([
          '/',
          '/index.html',
          '/js/dataCollection.js',
          '/images/johannes-icon.jpg',
      ]).then(function() {
          console.log('cache installed');
          return self.skipWaiting();
      });
    })
  );
});

self.addEventListener('activate', function(event) {
    console.log('activate', event);
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
    console.log(event.request.url);

    event.respondWith(
    caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
    })
  );
});