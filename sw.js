// Shows phone notifications for Financial Independence
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data.json(); } catch (err) { d = { title: "Financial Independence", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Financial Independence", {
    body: d.body || "",
    icon: "icon.png",
    badge: "icon.png"
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow("./");
  }));
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin === self.location.origin) {
    e.respondWith(
      fetch(r, { cache: "no-cache" }).then(res => {
        if (res.ok && !u.search) { const c = res.clone(); caches.open("app-v1").then(k => k.put(r, c)); }
        return res;
      }).catch(() => caches.match(r, { ignoreSearch: true }).then(x => x || Response.error()))
    );
    return;
  }
  if (u.hostname === "cdn.jsdelivr.net") {
    e.respondWith(caches.open("cdn-v1").then(async k => {
      const hit = await k.match(r);
      const net = fetch(r).then(res => { if (res.ok || res.type === "opaque") k.put(r, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
