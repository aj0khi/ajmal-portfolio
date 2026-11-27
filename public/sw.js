// The site used to install a caching service worker. This version retires it: it clears every
// cache it made and unregisters itself, so returning visitors load the site straight from the
// network from now on.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    await self.registration.unregister();
  })());
});
