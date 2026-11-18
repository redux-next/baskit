
"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        const registration =
          await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });

        console.log(
          "QuickBite PWA registered:",
          registration.scope
        );
      } catch (error) {
        console.error(
          "QuickBite PWA registration failed:",
          error
        );
      }
    };

    registerServiceWorker();
  }, []);

  return null;
}
