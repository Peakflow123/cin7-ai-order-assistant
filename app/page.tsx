import Link from 'next/link';
export default function Home() {
  return <main className="min-h-screen flex items-center justify-center p-6">
    <div className="card max-w-xl text-center">
      <h1 className="text-3xl font-bold mb-3">Cin7 AI Order Assistant</h1>
      <p className="text-slate-600 mb-6">Central SaaS platform for converting customer emails into reviewed Cin7 sales orders.</p>
      <div className="flex gap-3 justify-center"><Link className="btn" href="/register">Create account</Link><Link className="btn" href="/login">Login</Link></div>
    </div>
  </main>;
}
