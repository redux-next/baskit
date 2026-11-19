
"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration;

    const registerServiceWorker = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        console.log(
          "DailyCart PWA registered:",
          registration.scope
        );

        // Check for service worker updates.
        await registration.update();

        // Log when a new service worker is waiting.
        if (registration.waiting) {
          console.log("DailyCart: New service worker is waiting.");
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("DailyCart PWA updated.");
            }
          });
        });

      } catch (error) {
        console.error(
          "DailyCart PWA registration failed:",
          error
        );
      }
    };

    registerServiceWorker();

    // Refresh the page when a new service worker takes control.
    const handleControllerChange = () => {
      console.log("DailyCart service worker controller changed.");
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  return null;
}
