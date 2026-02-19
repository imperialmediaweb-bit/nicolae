// Casa Nicolae - Service Worker for Push Notifications

const CACHE_NAME = "casa-nicolae-v1";

// Install event
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Push notification received
self.addEventListener("push", (event) => {
  let data = { title: "Casa Nicolae", body: "Notificare noua" };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "casa-nicolae",
    renotify: true,
    data: {
      url: data.url || "/farmacie",
    },
    actions: data.actions || [
      { action: "view", title: "Vezi detalii" },
      { action: "dismiss", title: "Ignora" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click on notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/farmacie";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});

// Background sync - check pharmacy stock periodically
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-pharmacy-stock") {
    event.waitUntil(checkPharmacyStock());
  }
});

async function checkPharmacyStock() {
  try {
    const response = await fetch("/api/notificari");
    if (!response.ok) return;

    const data = await response.json();
    if (data.critical > 0) {
      const criticalNotifs = data.notifications.filter((n) => n.severity === "critical");
      await self.registration.showNotification("Casa Nicolae - Alerta Farmacie", {
        body: `${data.critical} alerte critice: ${criticalNotifs.map((n) => n.medicationName).join(", ")}`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        vibrate: [200, 100, 200, 100, 200],
        tag: "pharmacy-critical",
        renotify: true,
        data: { url: "/farmacie" },
      });
    }
  } catch {
    // Silently fail
  }
}
