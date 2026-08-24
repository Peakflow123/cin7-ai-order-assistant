[1mdiff --git a/app/admin/launch/AdminPortalShell.tsx b/app/admin/launch/AdminPortalShell.tsx[m
[1mindex 0114aae9..4b15ebba 100644[m
[1m--- a/app/admin/launch/AdminPortalShell.tsx[m
[1m+++ b/app/admin/launch/AdminPortalShell.tsx[m
[36m@@ -1,8 +1,9 @@[m
[31m-import Link from 'next/link';[m
[32m+[m[32m﻿import Link from 'next/link';[m
 [m
 const navItems = [[m
   { href: '/admin/launch', label: 'Overview', description: 'Command center' },[m
   { href: '/admin/launch/clients', label: 'Clients & Controls', description: 'Client limits and permissions' },[m
[32m+[m[32m  { label: 'Billing', href: '/admin/billing' },[m
   { href: '/admin/launch/usage', label: 'Usage & Storage', description: 'Storage and volume' },[m
   { href: '/admin/launch/activity', label: 'Activity', description: 'Admin action history' },[m
   { href: '/admin/launch/errors', label: 'Errors', description: 'Failed orders' },[m
[1mdiff --git a/components/ClientPortalFrame.tsx b/components/ClientPortalFrame.tsx[m
[1mindex d9d7e018..24d62cb0 100644[m
[1m--- a/components/ClientPortalFrame.tsx[m
[1m+++ b/components/ClientPortalFrame.tsx[m
[36m@@ -1,4 +1,4 @@[m
[31m-import Link from 'next/link';[m
[32m+[m[32m﻿import Link from 'next/link';[m
 import '@/app/client-portal.css';[m
 [m
 const desktopNav = [[m
[36m@@ -6,15 +6,16 @@[m [mconst desktopNav = [[m
   { href: '/orders', label: 'Orders' },[m
   { href: '/mobile', label: 'Review Orders' },[m
   { href: '/email', label: 'Channels' },[m
[32m+[m[32m  { href: '/billing', label: 'Billing' },[m
   { href: '/settings', label: 'Settings' }[m
 ];[m
 [m
 const mobileNav = [[m
[31m-  { href: '/dashboard', label: 'Dashboard', icon: '⌂' },[m
[31m-  { href: '/orders', label: 'Orders', icon: '▦' },[m
[31m-  { href: '/mobile', label: 'Review', icon: '✓' },[m
[31m-  { href: '/email', label: 'Channels', icon: '✉' },[m
[31m-  { href: '/settings', label: 'Settings', icon: '⚙' }[m
[32m+[m[32m  { href: '/dashboard', label: 'Dashboard', icon: 'âŚ‚' },[m
[32m+[m[32m  { href: '/orders', label: 'Orders', icon: 'â–¦' },[m
[32m+[m[32m  { href: '/mobile', label: 'Review', icon: 'âś“' },[m
[32m+[m[32m  { href: '/email', label: 'Channels', icon: 'âś‰' },[m
[32m+[m[32m  { href: '/settings', label: 'Settings', icon: 'âš™' }[m
 ];[m
 [m
 export default function ClientPortalFrame({ children, companyName }: { children: React.ReactNode; companyName?: string | null }) {[m
[1mdiff --git a/app/page.tsx b/app/page.tsx[m
[1mindex bc6831f8..4df82d04 100644[m
[1m--- a/app/page.tsx[m
[1m+++ b/app/page.tsx[m
[36m@@ -1,60 +1,56 @@[m
 import Link from 'next/link';[m
[31m-[m
[31m-function Mark() {[m
[31m-  return <span style={{ display:'grid', placeItems:'center', width:48, height:48, borderRadius:15, color:'#fff', fontWeight:900, fontSize:22, background:'linear-gradient(135deg,#2563eb 0%,#0891b2 54%,#10b981 100%)', boxShadow:'0 10px 24px rgba(37,99,235,.18)' }}>N</span>;[m
[31m-}[m
[32m+[m[32mimport { redirect } from 'next/navigation';[m
[32m+[m[32mimport { getSession, isPlatformAdmin } from '@/lib/auth';[m
 [m
 export default function HomePage() {[m
[31m-  return ([m
[31m-    <main style={{ minHeight:'100vh', background:'#f7f9fc', color:'#0f172a', fontFamily:'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>[m
[31m-      <header style={{ background:'#fff', borderBottom:'1px solid #e6eaf0' }}>[m
[31m-        <div style={{ maxWidth:1180, margin:'0 auto', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:20 }}>[m
[31m-          <Link href="/" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none', color:'inherit' }}>[m
[31m-            <Mark />[m
[31m-            <span><strong style={{ display:'block', fontSize:21, lineHeight:1.15 }}>NexOrder AI</strong><span style={{ display:'block', marginTop:3, color:'#64748b', fontSize:14 }}>AI order automation for Cin7 Core</span></span>[m
[31m-          </Link>[m
[31m-          <Link href="/login" style={{ padding:'11px 18px', borderRadius:12, background:'#2563eb', color:'#fff', fontWeight:800, textDecoration:'none', boxShadow:'0 8px 18px rgba(37,99,235,.16)' }}>Login</Link>[m
[31m-        </div>[m
[31m-      </header>[m
[32m+[m[32m  const session = getSession();[m
[32m+[m[32m  if (session) redirect(isPlatformAdmin(session) ? '/admin' : '/dashboard');[m
 [m
[31m-      <section style={{ maxWidth:1180, margin:'0 auto', padding:'82px 24px 64px', display:'grid', gridTemplateColumns:'minmax(0,1.08fr) minmax(340px,.92fr)', gap:56, alignItems:'center' }} className="public-hero-grid">[m
[32m+[m[32m  return ([m
[32m+[m[32m    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_30%),linear-gradient(135deg,#f8fafc,#eef2ff_48%,#ecfeff)] text-slate-950">[m
[32m+[m[32m      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">[m
         <div>[m
[31m-          <p style={{ display:'inline-flex', margin:0, padding:'8px 12px', border:'1px solid #bfdbfe', borderRadius:999, background:'#eff6ff', color:'#1d4ed8', fontSize:14, fontWeight:800 }}>Built for businesses using Cin7 Core</p>[m
[31m-          <h1 style={{ margin:'24px 0 18px', maxWidth:760, fontSize:'clamp(42px,5.2vw,72px)', lineHeight:1.02, letterSpacing:'-0.045em', fontWeight:900 }}>Sales orders created from customer emails, automatically.</h1>[m
[31m-          <p style={{ margin:0, maxWidth:690, color:'#475569', fontSize:'clamp(18px,2vw,22px)', lineHeight:1.65 }}>NexOrder AI reads emails and attachments, matches customers and products, and creates accurate sales orders in Cin7 Core.</p>[m
[31m-          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:32 }}>[m
[31m-            <Link href="/register" style={{ padding:'14px 22px', borderRadius:13, background:'#2563eb', color:'#fff', fontWeight:850, textDecoration:'none', boxShadow:'0 12px 28px rgba(37,99,235,.2)' }}>Start 15-day free trial</Link>[m
[31m-            <Link href="/login" style={{ padding:'14px 22px', borderRadius:13, background:'#fff', border:'1px solid #dbe2ea', color:'#0f172a', fontWeight:850, textDecoration:'none' }}>Login</Link>[m
[32m+[m[32m          <span className="inline-flex rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm">Built for businesses using Cin7 Core</span>[m
[32m+[m[32m          <h1 className="mt-7 text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">Turn customer emails and attachments into Cin7 sales orders automatically.</h1>[m
[32m+[m[32m          <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">NexOrder AI reads customer emails, PDFs, spreadsheets, Word files and screenshots, then creates Cin7-ready sales orders so teams spend less time on manual entry and more time serving customers.</p>[m
[32m+[m
[32m+[m[32m          <div className="mt-8 flex flex-col gap-3 sm:flex-row">[m
[32m+[m[32m            <Link className="rounded-2xl bg-blue-600 px-7 py-4 text-center font-black text-white shadow-xl shadow-blue-500/20 transition hover:bg-blue-700" href="/register">Start 15-day free trial</Link>[m
[32m+[m[32m            <Link className="rounded-2xl border border-slate-200 bg-white px-7 py-4 text-center font-black text-slate-800 shadow-sm transition hover:bg-slate-50" href="/login">Login</Link>[m
           </div>[m
[31m-          <p style={{ margin:'15px 0 0', color:'#64748b', fontSize:14 }}>No credit card required.</p>[m
[32m+[m[32m          <p className="mt-4 text-sm font-semibold text-slate-500">No credit card required for the trial. Subscribe only if NexOrder AI saves value for your team.</p>[m
         </div>[m
 [m
[31m-        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:28, padding:24, boxShadow:'0 24px 60px rgba(15,23,42,.10)' }}>[m
[31m-          <div style={{ background:'#0b1224', color:'#fff', borderRadius:22, padding:25 }}>[m
[31m-            <div style={{ display:'flex', justifyContent:'space-between', gap:16, alignItems:'center', paddingBottom:18, borderBottom:'1px solid rgba(255,255,255,.1)' }}>[m
[31m-              <div><span style={{ color:'#94a3b8', fontSize:13 }}>Incoming order</span><strong style={{ display:'block', marginTop:4 }}>customer-order.pdf</strong></div>[m
[31m-              <span style={{ padding:'7px 10px', borderRadius:999, background:'rgba(16,185,129,.16)', color:'#6ee7b7', fontSize:13, fontWeight:800 }}>AI extracted</span>[m
[31m-            </div>[m
[31m-            {[[m
[31m-              ['Customer','Matched to Cin7 customer'],[m
[31m-              ['Products','Matched to SKU and order history'],[m
[31m-              ['Result','Sales order created in Cin7 Core'][m
[31m-            ].map(([label,value], index) => ([m
[31m-              <div key={label} style={{ marginTop:14, padding:'16px 17px', borderRadius:15, background:'rgba(255,255,255,.075)' }}>[m
[31m-                <span style={{ color:'#94a3b8', fontSize:13 }}>{label}</span>[m
[31m-                <strong style={{ display:'block', marginTop:5, color:index === 2 ? '#67e8f9' : '#fff', lineHeight:1.35 }}>{value}</strong>[m
[32m+[m[32m        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-2xl shadow-slate-300/50 backdrop-blur">[m
[32m+[m[32m          <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-inner">[m
[32m+[m[32m            <div className="flex items-center justify-between border-b border-white/10 pb-4">[m
[32m+[m[32m              <div>[m
[32m+[m[32m                <p className="text-sm text-slate-400">Incoming customer order</p>[m
[32m+[m[32m                <p className="font-black">customer-order.pdf</p>[m
               </div>[m
[31m-            ))}[m
[32m+[m[32m              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-bold text-emerald-300">AI extracted</span>[m
[32m+[m[32m            </div>[m
[32m+[m[32m            <div className="mt-5 space-y-3 text-sm">[m
[32m+[m[32m              <div className="rounded-2xl bg-white/10 p-4"><span className="text-slate-400">Customer</span><p className="font-bold">Matched to Cin7 customer</p></div>[m
[32m+[m[32m              <div className="rounded-2xl bg-white/10 p-4"><span className="text-slate-400">Products</span><p className="font-bold">Matched by SKU, name, aliases and learning history</p></div>[m
[32m+[m[32m              <div className="rounded-2xl bg-white/10 p-4"><span className="text-slate-400">Result</span><p className="font-bold text-cyan-300">Sales order created in Cin7 Core</p></div>[m
[32m+[m[32m            </div>[m
           </div>[m
         </div>[m
       </section>[m
 [m
[31m-      <section style={{ maxWidth:1180, margin:'0 auto', padding:'10px 24px 80px', display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:16 }} className="public-benefits-grid">[m
[31m-        {[['Faster order entry','Reduce repetitive manual order processing.'],['Fewer errors','Match customers, products and quantities consistently.'],['Works with your inbox','Process Gmail, Outlook, PDFs, spreadsheets and screenshots.']].map(([title,text]) => ([m
[31m-          <div key={title} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:18, padding:22 }}><strong style={{ fontSize:17 }}>{title}</strong><p style={{ margin:'8px 0 0', color:'#64748b', lineHeight:1.55 }}>{text}</p></div>[m
[32m+[m[32m      <section className="mx-auto grid max-w-7xl gap-4 px-6 pb-16 md:grid-cols-3">[m
[32m+[m[32m        {[[m
[32m+[m[32m          ['Reduce manual order entry', 'Automate repetitive order capture from inboxes and attachments.'],[m
[32m+[m[32m          ['Process orders faster', 'Move from email to Cin7 sales order in minutes instead of manual retyping.'],[m
[32m+[m[32m          ['Handle messy formats', 'Emails, PDFs, spreadsheets, Word documents and screenshots.'][m
[32m+[m[32m        ].map(([title, text]) => ([m
[32m+[m[32m          <div key={title} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm">[m
[32m+[m[32m            <h3 className="text-xl font-black">{title}</h3>[m
[32m+[m[32m            <p className="mt-2 text-slate-600">{text}</p>[m
[32m+[m[32m          </div>[m
         ))}[m
       </section>[m
[31m-      <style>{`@media (max-width: 820px){.public-hero-grid{grid-template-columns:1fr!important;padding-top:48px!important;gap:34px!important}.public-benefits-grid{grid-template-columns:1fr!important}}`}</style>[m
     </main>[m
   );[m
 }[m
[1mdiff --git a/components/ClientPortalFrame.tsx b/components/ClientPortalFrame.tsx[m
[1mindex 84e5a38b..24d62cb0 100644[m
[1m--- a/components/ClientPortalFrame.tsx[m
[1m+++ b/components/ClientPortalFrame.tsx[m
[36m@@ -1,107 +1,46 @@[m
[31m-'use client';[m
[31m-[m
[31m-import Link from 'next/link';[m
[31m-import { usePathname } from 'next/navigation';[m
[31m-import { useEffect, useState, type ReactNode } from 'react';[m
[31m-[m
[31m-type Props = {[m
[31m-  children: ReactNode;[m
[31m-  companyName?: string | null;[m
[31m-};[m
[32m+[m[32m﻿import Link from 'next/link';[m
[32m+[m[32mimport '@/app/client-portal.css';[m
 [m
 const desktopNav = [[m
   { href: '/dashboard', label: 'Dashboard' },[m
   { href: '/orders', label: 'Orders' },[m
   { href: '/mobile', label: 'Review Orders' },[m
   { href: '/email', label: 'Channels' },[m
[32m+[m[32m  { href: '/billing', label: 'Billing' },[m
   { href: '/settings', label: 'Settings' }[m
 ];[m
 [m
 const mobileNav = [[m
[31m-  { href: '/dashboard', label: 'Dashboard', icon: 'home' },[m
[31m-  { href: '/orders', label: 'Orders', icon: 'orders' },[m
[31m-  { href: '/mobile', label: 'Review', icon: 'review' },[m
[31m-  { href: '/email', label: 'Channels', icon: 'channels' },[m
[31m-  { href: '/settings', label: 'Settings', icon: 'settings' }[m
[32m+[m[32m  { href: '/dashboard', label: 'Dashboard', icon: 'âŚ‚' },[m
[32m+[m[32m  { href: '/orders', label: 'Orders', icon: 'â–¦' },[m
[32m+[m[32m  { href: '/mobile', label: 'Review', icon: 'âś“' },[m
[32m+[m[32m  { href: '/email', label: 'Channels', icon: 'âś‰' },[m
[32m+[m[32m  { href: '/settings', label: 'Settings', icon: 'âš™' }[m
 ];[m
 [m
[31m-function BrandMark({ small = false }: { small?: boolean }) {[m
[32m+[m[32mexport default function ClientPortalFrame({ children, companyName }: { children: React.ReactNode; companyName?: string | null }) {[m
   return ([m
[31m-    <span className={small ? 'client-brand-mark client-brand-mark-small' : 'client-brand-mark'} aria-hidden="true">[m
[31m-      N[m
[31m-    </span>[m
[31m-  );[m
[31m-}[m
[31m-[m
[31m-function NavIcon({ name }: { name: string }) {[m
[31m-  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };[m
[31m-  if (name === 'home') return <svg {...common}><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>;[m
[31m-  if (name === 'orders') return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;[m
[31m-  if (name === 'review') return <svg {...common}><path d="M9 11.5 11 13.5 15.5 9"/><path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.8 7.5 9.5 4.4-1.7 7.5-4.9 7.5-9.5V6L12 3Z"/></svg>;[m
[31m-  if (name === 'channels') return <svg {...common}><path d="M4 5h16v14H4z"/><path d="m4 7 8 6 8-6"/></svg>;[m
[31m-  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21h-4v-.09a1.7 1.7 0 0 0-1.1-1.51 1.7 1.7 0 0 0-1.87.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V3h4v.09A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.13.38.34.72.6 1 .28.27.63.47 1 .57h.09v4H21a1.7 1.7 0 0 0-1.6.43Z"/></svg>;[m
[31m-}[m
[31m-[m
[31m-export default function ClientPortalFrame({ children, companyName }: Props) {[m
[31m-  const pathname = usePathname();[m
[31m-  const [resolvedCompanyName, setResolvedCompanyName] = useState(companyName?.trim() || '');[m
[31m-[m
[31m-  useEffect(() => {[m
[31m-    if (companyName?.trim()) {[m
[31m-      setResolvedCompanyName(companyName.trim());[m
[31m-      return;[m
[31m-    }[m
[31m-    let cancelled = false;[m
[31m-    fetch('/api/company/current', { cache: 'no-store' })[m
[31m-      .then((response) => response.ok ? response.json() : null)[m
[31m-      .then((data) => {[m
[31m-        if (!cancelled && data?.name) setResolvedCompanyName(String(data.name));[m
[31m-      })[m
[31m-      .catch(() => undefined);[m
[31m-    return () => { cancelled = true; };[m
[31m-  }, [companyName]);[m
[31m-[m
[31m-  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));[m
[31m-[m
[31m-  return ([m
[31m-    <div className="client-portal-frame">[m
[31m-      <header className="client-desktop-header">[m
[31m-        <Link href="/dashboard" className="client-brand" aria-label="NexOrder AI dashboard">[m
[31m-          <BrandMark />[m
[31m-          <span className="client-brand-copy">[m
[31m-            <strong>NexOrder AI</strong>[m
[31m-            <span>{resolvedCompanyName || 'Your company'}</span>[m
[31m-          </span>[m
[31m-        </Link>[m
[31m-        <nav className="client-desktop-nav" aria-label="Client navigation">[m
[31m-          {desktopNav.map((item) => ([m
[31m-            <Link key={item.href} href={item.href} className={isActive(item.href) ? 'active' : ''}>{item.label}</Link>[m
[31m-          ))}[m
[31m-          <form action="/api/auth/logout" method="post">[m
[31m-            <button className="logout-button" type="submit">Logout</button>[m
[31m-          </form>[m
[31m-        </nav>[m
[31m-      </header>[m
[31m-[m
[31m-      <header className="client-mobile-header">[m
[31m-        <Link href="/dashboard" className="client-brand" aria-label="NexOrder AI dashboard">[m
[31m-          <BrandMark small />[m
[31m-          <span className="client-brand-copy">[m
[31m-            <strong>NexOrder AI</strong>[m
[31m-            <span>{resolvedCompanyName || 'Your company'}</span>[m
[31m-          </span>[m
[31m-        </Link>[m
[31m-      </header>[m
[31m-[m
[31m-      <div className="client-portal-content">{children}</div>[m
[31m-[m
[31m-      <nav className="client-mobile-bottom-nav" aria-label="Mobile navigation">[m
[31m-        {mobileNav.map((item) => ([m
[31m-          <Link key={item.href} href={item.href} className={isActive(item.href) ? 'active' : ''}>[m
[31m-            <NavIcon name={item.icon} />[m
[31m-            <span>{item.label}</span>[m
[32m+[m[32m    <div className="client-portal">[m
[32m+[m[32m      <header className="client-topbar">[m
[32m+[m[32m        <div className="client-topbar-inner">[m
[32m+[m[32m          <Link href="/dashboard" className="client-brand">[m
[32m+[m[32m            <div className="client-brand-mark">N</div>[m
[32m+[m[32m            <div className="client-brand-text">[m
[32m+[m[32m              <div className="client-brand-title">NexOrder AI</div>[m
[32m+[m[32m              <div className="client-brand-subtitle">{companyName || 'Order automation workspace'}</div>[m
[32m+[m[32m            </div>[m
           </Link>[m
[31m-        ))}[m
[32m+[m[32m          <nav className="client-nav">[m
[32m+[m[32m            {desktopNav.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}[m
[32m+[m[32m            <form action="/api/auth/logout" method="post">[m
[32m+[m[32m              <button className="logout-button" type="submit">Logout</button>[m
[32m+[m[32m            </form>[m
[32m+[m[32m          </nav>[m
[32m+[m[32m        </div>[m
[32m+[m[32m      </header>[m
[32m+[m[32m      {children}[m
[32m+[m[32m      <nav className="client-mobile-nav">[m
[32m+[m[32m        {mobileNav.map((item) => <Link key={item.href} href={item.href}><span>{item.icon}</span>{item.label}</Link>)}[m
       </nav>[m
     </div>[m
   );[m
