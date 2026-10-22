// Service worker: makes the app load offline after the first visit.
// Strategy: precache the app shell and data; serve from cache, refresh in the background.
// Bump CACHE when any shipped file changes so phones pick up the new version.
const CACHE = "vocab4000-v138";
// Offline audio lives in its own cache so app updates never wipe a downloaded pack.
const AUDIO_CACHE = "vocab4000-audio";
const SHELL = [
  "./",
  "./index.html",
  "./static/styles.css",
  "./static/app.js",
  "./static/modern-dark.js",
  "./static/splash.js",
  "./static/fonts/Vazirmatn.ttf",
  "./data/entries.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Only the app shell (SHELL above) is cached. Anything else same-origin goes straight to the network,
// so the cache can't fill up with arbitrary responses or hold stale copies of unrelated URLs.
const SHELL_PATHS = new Set(SHELL.map((p) => new URL(p, self.location.href).pathname));
const AUDIO_PATH = new URL("./audio/", self.location.href).pathname; // only the app's own audio folder

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // third-party requests are never cached or intercepted

  // Audio clips and the pack index: serve from the offline audio cache first.
  if (url.pathname.startsWith(AUDIO_PATH)) {
    event.respondWith(audioFirst(req));
    return;
  }

  // /index.html redirects to the root on some hosts; a redirected response can't answer a page navigation, so serve the root instead.
  if (req.mode === "navigate" && url.pathname.endsWith("/index.html")) {
    event.respondWith(caches.open(CACHE).then((c) => c.match("./", { ignoreSearch: true }).then((h) => h || fetch("./", { redirect: "follow" }))));
    return;
  }

  if (!SHELL_PATHS.has(url.pathname)) return; // not part of the app shell: let the browser handle it

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === "basic") cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      const fresh = await network;
      if (fresh && fresh.ok) return fresh;
      if (req.mode === "navigate") {
        // Offline (or the network answered with an error page): always fall back to the app itself.
        const home = (await cache.match("./index.html", { ignoreSearch: true })) || (await cache.match("./", { ignoreSearch: true }));
        if (home) return home;
      }
      return fresh || Response.error();
    })
  );
});

async function audioFirst(req) {
  const cache = await caches.open(AUDIO_CACHE);
  // The pack index changes when the audio is rebuilt, so try the network first and fall back to the saved copy.
  if (new URL(req.url).pathname.endsWith("/audio/index.json")) {
    try {
      const fresh = await fetch(req, { cache: "no-cache" });
      if (fresh.ok && fresh.type === "basic") { cache.put(req, fresh.clone()); return fresh; }
    } catch (e) { /* offline: use the saved copy below */ }
    return (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  try {
    const res = await fetch(req);
    // Keep whole clips only (skip Range responses), so the cache never holds partial audio.
    if (res.ok && res.type === "basic" && !req.headers.get("range")) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return Response.error();
  }
}
