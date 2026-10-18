// Service worker: guarda todos los archivos del juego para que funcione sin
// conexión. Al cambiar VERSION se renueva la caché en la siguiente visita.
const VERSION = 'v4';
const CACHE = `cria-dragones-${VERSION}`;
const ARCHIVOS = [
  './', './index.html', './panel.html', './manifest.webmanifest',
  './css/juego.css', './css/panel.css',
  './js/app.js', './js/panel.js', './js/estado.js', './js/dia.js', './js/escalera.js', './js/camino.js',
  './js/grafias.js', './js/sprites.js', './js/dragones.js', './js/voz.js', './js/sonidos.js', './js/util/rng.js',
  './js/bancos/palabras.js', './js/bancos/plantillas.js', './js/bancos/silabas.js',
  './js/generador/nombres.js', './js/generador/escena.js', './js/generador/frases.js', './js/generador/ronda.js',
  './js/ejercicios/render.js',
  './iconos/icono-192.png', './iconos/icono-512.png',
];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys().then(claves => Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Caché primero; en segundo plano se pide a la red para tener la versión nueva.
self.addEventListener('fetch', ev => {
  if (ev.request.method !== 'GET' || new URL(ev.request.url).origin !== location.origin) return;
  ev.respondWith(
    caches.match(ev.request, { ignoreSearch: true }).then(enCache => {
      const red = fetch(ev.request).then(resp => {
        if (resp && resp.ok) caches.open(CACHE).then(c => c.put(ev.request, resp.clone()));
        return resp;
      }).catch(() => enCache);
      return enCache || red;
    }),
  );
});
