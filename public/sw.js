const CACHE_NAME = "agriva-shell-v2";
const APP_SHELL = ["/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("agriva-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});


self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = typeof payload.title === "string" && payload.title.trim()
    ? payload.title.slice(0, 120)
    : "AGRIVA";
  const options = {
    body: typeof payload.body === "string" ? payload.body.slice(0, 300) : "",
    icon: typeof payload.icon === "string" ? payload.icon : "/branding/agriva-app-icon-192.png",
    badge: typeof payload.badge === "string" ? payload.badge : "/branding/agriva-app-icon-192.png",
    tag: typeof payload.tag === "string" ? payload.tag.slice(0, 160) : "agriva-update",
    data: { url: typeof payload.url === "string" ? payload.url : "/notifications" },
    renotify: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    let target = new URL("/notifications", self.location.origin);
    try {
      const candidate = new URL(event.notification.data?.url || "/notifications", self.location.origin);
      if (candidate.origin === self.location.origin) target = candidate;
    } catch {
      // Keep the safe in-app notifications fallback.
    }

    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target.href);
        return;
      }
    }
    await self.clients.openWindow(target.href);
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || url.pathname.startsWith("/login")) return;
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      return cached || caches.match("/offline");
    })
  );
});
