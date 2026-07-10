export default function EmailPage() {
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="card space-y-4">
        <h1 className="text-2xl font-bold">Email Connections</h1>
        <p className="text-slate-600">
          MVP includes manual email testing first. OAuth starter routes are included for Outlook and Gmail.
        </p>
        <a className="btn inline-block" href="/api/outlook/connect">Connect Outlook</a>
        <a className="btn inline-block ml-3" href="/api/gmail/connect">Connect Gmail</a>
      </div>
    </main>
  );
}
