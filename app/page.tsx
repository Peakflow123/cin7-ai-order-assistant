import Link from 'next/link';

function Mark() {
  return <span style={{ display:'grid', placeItems:'center', width:48, height:48, borderRadius:15, color:'#fff', fontWeight:900, fontSize:22, background:'linear-gradient(135deg,#2563eb 0%,#0891b2 54%,#10b981 100%)', boxShadow:'0 10px 24px rgba(37,99,235,.18)' }}>N</span>;
}

export default function HomePage() {
  return (
    <main style={{ minHeight:'100vh', background:'#f7f9fc', color:'#0f172a', fontFamily:'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <header style={{ background:'#fff', borderBottom:'1px solid #e6eaf0' }}>
        <div style={{ maxWidth:1180, margin:'0 auto', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:20 }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none', color:'inherit' }}>
            <Mark />
            <span><strong style={{ display:'block', fontSize:21, lineHeight:1.15 }}>NexOrder AI</strong><span style={{ display:'block', marginTop:3, color:'#64748b', fontSize:14 }}>AI order automation for Cin7 Core</span></span>
          </Link>
          <Link href="/login" style={{ padding:'11px 18px', borderRadius:12, background:'#2563eb', color:'#fff', fontWeight:800, textDecoration:'none', boxShadow:'0 8px 18px rgba(37,99,235,.16)' }}>Login</Link>
        </div>
      </header>

      <section style={{ maxWidth:1180, margin:'0 auto', padding:'82px 24px 64px', display:'grid', gridTemplateColumns:'minmax(0,1.08fr) minmax(340px,.92fr)', gap:56, alignItems:'center' }} className="public-hero-grid">
        <div>
          <p style={{ display:'inline-flex', margin:0, padding:'8px 12px', border:'1px solid #bfdbfe', borderRadius:999, background:'#eff6ff', color:'#1d4ed8', fontSize:14, fontWeight:800 }}>Built for businesses using Cin7 Core</p>
          <h1 style={{ margin:'24px 0 18px', maxWidth:760, fontSize:'clamp(42px,5.2vw,72px)', lineHeight:1.02, letterSpacing:'-0.045em', fontWeight:900 }}>Sales orders created from customer emails, automatically.</h1>
          <p style={{ margin:0, maxWidth:690, color:'#475569', fontSize:'clamp(18px,2vw,22px)', lineHeight:1.65 }}>NexOrder AI reads emails and attachments, matches customers and products, and creates accurate sales orders in Cin7 Core.</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:32 }}>
            <Link href="/register" style={{ padding:'14px 22px', borderRadius:13, background:'#2563eb', color:'#fff', fontWeight:850, textDecoration:'none', boxShadow:'0 12px 28px rgba(37,99,235,.2)' }}>Start 15-day free trial</Link>
            <Link href="/login" style={{ padding:'14px 22px', borderRadius:13, background:'#fff', border:'1px solid #dbe2ea', color:'#0f172a', fontWeight:850, textDecoration:'none' }}>Login</Link>
          </div>
          <p style={{ margin:'15px 0 0', color:'#64748b', fontSize:14 }}>No credit card required.</p>
        </div>

        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:28, padding:24, boxShadow:'0 24px 60px rgba(15,23,42,.10)' }}>
          <div style={{ background:'#0b1224', color:'#fff', borderRadius:22, padding:25 }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:16, alignItems:'center', paddingBottom:18, borderBottom:'1px solid rgba(255,255,255,.1)' }}>
              <div><span style={{ color:'#94a3b8', fontSize:13 }}>Incoming order</span><strong style={{ display:'block', marginTop:4 }}>customer-order.pdf</strong></div>
              <span style={{ padding:'7px 10px', borderRadius:999, background:'rgba(16,185,129,.16)', color:'#6ee7b7', fontSize:13, fontWeight:800 }}>AI extracted</span>
            </div>
            {[
              ['Customer','Matched to Cin7 customer'],
              ['Products','Matched to SKU and order history'],
              ['Result','Sales order created in Cin7 Core']
            ].map(([label,value], index) => (
              <div key={label} style={{ marginTop:14, padding:'16px 17px', borderRadius:15, background:'rgba(255,255,255,.075)' }}>
                <span style={{ color:'#94a3b8', fontSize:13 }}>{label}</span>
                <strong style={{ display:'block', marginTop:5, color:index === 2 ? '#67e8f9' : '#fff', lineHeight:1.35 }}>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth:1180, margin:'0 auto', padding:'10px 24px 80px', display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:16 }} className="public-benefits-grid">
        {[['Faster order entry','Reduce repetitive manual order processing.'],['Fewer errors','Match customers, products and quantities consistently.'],['Works with your inbox','Process Gmail, Outlook, PDFs, spreadsheets and screenshots.']].map(([title,text]) => (
          <div key={title} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:18, padding:22 }}><strong style={{ fontSize:17 }}>{title}</strong><p style={{ margin:'8px 0 0', color:'#64748b', lineHeight:1.55 }}>{text}</p></div>
        ))}
      </section>
      <style>{`@media (max-width: 820px){.public-hero-grid{grid-template-columns:1fr!important;padding-top:48px!important;gap:34px!important}.public-benefits-grid{grid-template-columns:1fr!important}}`}</style>
    </main>
  );
}
