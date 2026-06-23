/* meili-trip service worker — offline field guide for the mountain.
   - App shell is precached on install.
   - HTML is network-first: online users always get fresh content (no stale page
     after future edits); offline falls back to the cached shell.
   - Everything else (Google Fonts, Leaflet CSS/JS, images, OSM tiles) is
     stale-while-revalidate: served instantly from cache, refreshed in the
     background — so any map region/zoom you viewed online stays available offline.
   Bump VERSION to force a clean re-cache (old caches are deleted on activate). */
var VERSION = 'v1';
var CACHE = 'meili-' + VERSION;

/* must-have, same-origin shell — addAll is atomic, so keep to files known to exist */
var SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './og-image.png'
];

/* cross-origin CDN assets — best effort: a CDN hiccup must not abort install */
var EXTRA = [
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Noto+Serif+Thai:wght@400;500;600;700&family=IBM+Plex+Sans+Thai:wght@300;400;500;600&display=swap',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll(SHELL).then(function(){
        return Promise.all(EXTRA.map(function(u){
          return fetch(u).then(function(r){ if(r && r.ok) return c.put(u, r); }).catch(function(){});
        }));
      });
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k !== CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url;
  try{ url = new URL(req.url); }catch(err){ return; }
  if(url.protocol !== 'http:' && url.protocol !== 'https:') return;

  var accept = req.headers.get('accept') || '';
  var isHTML = req.mode === 'navigate' || accept.indexOf('text/html') !== -1;

  if(isHTML){
    /* network-first: try fresh HTML, fall back to cached shell when offline */
    e.respondWith(
      fetch(req).then(function(res){
        if(res && res.ok){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); }
        return res;
      }).catch(function(){
        return caches.match(req, {ignoreSearch:true}).then(function(m){
          return m || caches.match('./index.html').then(function(h){ return h || caches.match('./'); });
        });
      })
    );
    return;
  }

  /* static assets + OSM tiles: stale-while-revalidate */
  e.respondWith(
    caches.match(req).then(function(cached){
      var network = fetch(req).then(function(res){
        if(res && (res.ok || res.type === 'opaque')){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); }
        return res;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
