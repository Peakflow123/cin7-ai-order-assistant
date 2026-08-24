'use client';

import { useEffect, useState } from 'react';

export default function InstallAppCard() {
  const [installed, setInstalled] = useState(false);
  const [deferred, setDeferred] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (standalone) { setInstalled(true); return; }

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const onPrompt = (e: any) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    const onInstalled = () => setInstalled(true);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch {}
    setDeferred(null);
  }

  return (
    <section className="card space-y-3">
      <h2 className="text-xl font-black">Install NexOrder AI</h2>
      <p className="text-sm text-slate-500">
        Install NexOrder AI as an app for faster access and a full-screen experience.
      </p>
      {deferred ? (
        <button className="btn" type="button" onClick={install}>Install App</button>
      ) : isIOS ? (
        <p className="text-sm text-slate-600">
          On iPhone/iPad: open this site in <b>Safari</b>, tap <b>Share</b>, then <b>Add to Home Screen</b>.
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          Open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.
        </p>
      )}
    </section>
  );
}
