const CACHE_NAME = "blindiq-offline-v1.42";

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/blindiq-logo.png",
  "/duck-home-page.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/maskable-icon-512.png",
  "/app-icon-1024.png",
  "/birds/american-black-duck.jpg",
  "/birds/american-coot.jpg",
  "/birds/american-wigeon.jpg",
  "/birds/black-bellied-whistling-duck.jpg",
  "/birds/blue-winged-teal.jpg",
  "/birds/brant.jpg",
  "/birds/bufflehead.jpg",
  "/birds/canada-goose.jpg",
  "/birds/canvasback.jpg",
  "/birds/gadwall.jpg",
  "/birds/goldeneye.jpg",
  "/birds/harlequin-duck.jpg",
  "/birds/long-tailed-duck.jpg",
  "/birds/mallard-drake.jpg",
  "/birds/mallard-hen.jpg",
  "/birds/merganser.jpg",
  "/birds/mottled-duck.png",
  "/birds/northern-pintail.jpg",
  "/birds/northern-shoveler.jpg",
  "/birds/redhead.jpg",
  "/birds/ring-necked-duck.jpg",
  "/birds/scaup.jpg",
  "/birds/scoter.jpg",
  "/birds/snow-goose.jpg",
  "/birds/tundra-swan.jpg",
  "/birds/waterfowl-group.jpg",
  "/birds/white-fronted-goose.jpg",
  "/birds/wilsons-snipe.jpg",
  "/birds/wood-duck.jpg",
];

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(CORE_ASSETS.map((asset) => cache.add(asset)));

  // Vite gives production JavaScript and CSS hashed filenames. Discover those
  // filenames from the current HTML so the installed app can open offline.
  try {
    const response = await fetch("/", { cache: "no-store" });
    if (!response.ok) return;
    const cacheableResponse = response.clone();
    const html = await response.text();
    await cache.put("/", cacheableResponse);
    await cache.put("/index.html", new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } }));

    const assetUrls = Array.from(html.matchAll(/(?:src|href)=["']([^"']+)["']/g))
      .map((match) => match[1])
      .filter((asset) => asset.startsWith("/") && !asset.startsWith("//"));
    await Promise.allSettled(assetUrls.map((asset) => cache.add(asset)));
  } catch {
    // CORE_ASSETS still provide the best available offline fallback.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function serveNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      if (new URL(request.url).pathname === "/") await cache.put("/", response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match("/")) || (await cache.match("/index.html")) || Response.error();
  }
}

async function serveAsset(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkRequest = fetch(request)
    .then((response) => {
      if (response.ok) void cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    event.waitUntil(networkRequest);
    return cached;
  }

  return (await networkRequest) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(request.mode === "navigate" ? serveNavigation(request) : serveAsset(request, event));
});
