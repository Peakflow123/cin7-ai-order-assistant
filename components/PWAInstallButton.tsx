'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function PWAInstallButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((window.navigator as any).standalone);
    setInstalled(standalone);

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function onAppInstalled() {
      setInstalled(true);
      setInstallEvent(null);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  if (installed) {
    return <span className="badge badge-green">Installed as mobile app</span>;
  }

  if (!installEvent) {
    return (
      <div className="soft-panel text-sm text-slate-600">
        To install on mobile: open the browser menu and choose <b>Add to Home Screen</b>. On Android/Chrome, an install button will appear when available.
      </div>
    );
  }

  return <button className="btn" onClick={install}>Install NexOrder AI App</button>;
}
