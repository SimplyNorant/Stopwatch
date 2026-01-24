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

  const { taskId, name } = data;

  if (data.type === "TIMER_DONE") {
    self.registration.showNotification("⏰ Timer finished", {
      body: name,
      tag: `timer-${taskId}`,
      requireInteraction: true,
      data: {
        taskId: taskId,
      },
      actions: [
        { action: "restart", title: "Restart" },
        { action: "reset", title: "Reset" },
      ],
      // icon: "/timer.png",
      // badge: "/timer-badge.png",
    });
  }

  if (data?.type === "CLOSE_TIMER_NOTIFICATION") {
    self.registration
      .getNotifications({
        tag: `timer-${taskId}`,
      })
      .then((notifications) => {
        notifications.forEach((n) => n.close());
      });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const taskId = event.notification.data?.taskId;

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientsArr) => {
        let client = clientsArr.find((c) =>
          c.url.startsWith(self.location.origin),
        );

        // On Reset/Restart Button Click
        if (event.action === "reset") {
          client.postMessage({
            type: "TIMER_RESET",
            taskId,
          });
          return;
        } else if (event.action === "restart") {
          client.postMessage({
            type: "TIMER_RESTART",
            taskId,
          });
          return;
        }

        // Always focus/open app
        if (client) {
          return client.focus();
        }

        return clients.openWindow("/");
      }),
  );
});
