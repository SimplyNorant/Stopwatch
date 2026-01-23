self.addEventListener("install", (event) => {
  console.log("SW installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("SW activated");
  self.clients.claim();

  // event.waitUntil(
  //   (async () => {
  //     await self.clients.claim();

  //     // 🔥 TEST NOTIFICATION (NOW SAFE)
  //     await self.registration.showNotification("🔥 SW TEST", {
  //       body: "Service Worker notifications now work",
  //       requireInteraction: true,
  //     });
  //   })(),
  // );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "TIMER_DONE") {
    self.registration.showNotification("⏰ Timer finished", {
      body: data.name,
      requireInteraction: true,
      // icon: "/timer.png", // optional
      // badge: "/timer-badge.png", // optional
    });
  }
});
