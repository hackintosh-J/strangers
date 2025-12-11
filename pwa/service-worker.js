// Service Worker for Strangers PWA
const STATIC_CACHE = 'strangers-static-v1';
const QUOTE_CACHE = 'strangers-quotes-v1';
const META_CACHE = 'strangers-meta-v1';
const UPDATE_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
const TIMESTAMP_KEY = 'warmth-last-update';

const STATIC_ASSETS = [
  '/',
  '/pwa/index.html',
  '/pwa/style.css',
  '/pwa/script.js',
  '/pwa/manifest.webmanifest',
  '/pwa/warmth-sentences.json',
  '/pwa/icons/icon-192.svg',
  '/pwa/icons/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(STATIC_ASSETS);
    })(),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('strangers-') && key !== STATIC_CACHE && key !== QUOTE_CACHE && key !== META_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

async function getLastUpdate() {
  const cache = await caches.open(META_CACHE);
  const match = await cache.match(TIMESTAMP_KEY);
  if (!match) return 0;
  const text = await match.text();
  return Number.parseInt(text, 10) || 0;
}

async function setLastUpdate(timestamp) {
  const cache = await caches.open(META_CACHE);
  await cache.put(TIMESTAMP_KEY, new Response(String(timestamp)));
}

async function handleWarmthRequest(request) {
  const cached = await caches.match(request);
  const lastUpdate = await getLastUpdate();
  const now = Date.now();
  if (!cached) {
    const network = await fetch(request);
    const quoteCache = await caches.open(QUOTE_CACHE);
    await quoteCache.put(request, network.clone());
    await setLastUpdate(now);
    return network;
  }
  if (now - lastUpdate > UPDATE_INTERVAL) {
    try {
      const network = await fetch(request);
      const quoteCache = await caches.open(QUOTE_CACHE);
      await quoteCache.put(request, network.clone());
      await setLastUpdate(now);
    } catch (error) {
      // ignore network errors; cached response is returned below
    }
  }
  return cached;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.pathname.endsWith('warmth-sentences.json')) {
    event.respondWith(handleWarmthRequest(request));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(caches.match('/pwa/index.html').then((cached) => cached || fetch(request)));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});