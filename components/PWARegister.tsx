'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.update()));
        await navigator.serviceWorker.register('/sw.js');
      } catch {
        // Ignore service worker update errors. App should continue normally.
      }
    });
  }, []);

  return null;
}
