'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Customer = { id: string; name: string; email?: string | null };
type Product = { id: string; sku?: string | null; name: string };
type OrderLine = { id: string; rawProductText: string; productId: string | null; productName: string | null; sku: string | null; quantity: number; confidence: number; status: string };
type Order = { id: string; status: string; source?: string | null; sourceAccount?: string | null; customerText: string | null; customerId: string | null; poNumber: string | null; originalText: string; lines: OrderLine[]; cin7SaleId?: string | null; error?: string | null };

function statusBadge(status: string) {
  if (status === 'CREATED') return 'badge badge-green';
  if (status === 'ERROR') return 'badge badge-red';
  if (status === 'NEEDS_REVIEW') return 'badge badge-yellow';
  return 'badge badge-gray';
}

export default function OrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteComment, setDeleteComment] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  async function loadOrder() {
    const response = await fetch(`/api/orders/${params.id}`);
    const data = await response.json();
    setOrder(data.order);
    setCustomers(data.customers || []);
    setProducts(data.products || []);
  }

  useEffect(() => { void loadOrder(); }, []);

  const canEdit = order ? order.status !== 'CREATED' && !order.cin7SaleId : false;
  const canCreate = order ? order.status !== 'CREATED' && !order.cin7SaleId && !isCreating : false;
  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products.slice(0, 500);
    return products.filter((product) => `${product.sku || ''} ${product.name}`.toLowerCase().includes(term)).slice(0, 500);
  }, [products, productSearch]);

  function updateLine(lineId: string, patch: Partial<OrderLine>) {
    if (!order) return;
    setOrder({ ...order, lines: order.lines.map((line) => line.id === lineId ? { ...line, ...patch } : line) });
  }

  async function saveReview() {
    if (!order) return;
    setIsSaving(true); setMessageType('info'); setMessage('Saving review changes...');
    const response = await fetch(`/api/orders/${order.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: order.customerId, poNumber: order.poNumber, lines: order.lines.map((line) => ({ id: line.id, productId: line.productId, quantity: line.quantity })) }) });
    const text = await response.text();
    setMessageType(response.ok ? 'success' : 'error'); setMessage(text); setIsSaving(false); await loadOrder();
  }

  async function createCin7Order() {
    if (!order || !canCreate) return;
    setIsCreating(true); setMessageType('info'); setMessage('Creating order in Cin7...');
    const response = await fetch(`/api/orders/${order.id}/create-cin7`, { method: 'POST' });
    const data = await response.json().catch(() => ({ message: 'Unknown response from server.' }));
    setMessageType(response.ok ? 'success' : 'error'); setMessage(data.message || (response.ok ? 'Order created successfully in Cin7.' : 'Failed to create order in Cin7.')); setIsCreating(false); await loadOrder();
  }

  async function deleteOrder() {
    if (!order) return;
    setIsDeleting(true); setMessageType('info'); setMessage('Deleting order and saving feedback...');
    const response = await fetch(`/api/orders/${order.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment: deleteComment }) });
    const data = await response.json().catch(async () => ({ message: await response.text() }));
    if (!response.ok) { setMessageType('error'); setMessage(data.message || 'Could not delete order.'); setIsDeleting(false); return; }
    window.location.href = '/orders?deleted=1';
  }

  if (!order) return <main className="page-shell"><div className="card">Loading order...</div></main>;

  return (
    <main className="page-shell space-y-6">
      <div className="hero-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/orders" className="text-sm font-bold text-blue-700 hover:text-blue-900">← Back to Orders</Link>
          <h1 className="page-title mt-2">Review Order</h1>
          <p className="page-subtitle">Confirm the customer, SKU mapping, and quantity before sending the order to Cin7.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge badge-blue">{order.source || 'manual'}</span>
            {order.sourceAccount && <span className="badge badge-purple">{order.sourceAccount}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={statusBadge(order.status)}>{order.status}</span>
          {order.cin7SaleId && <span className="badge badge-green">Cin7 Created</span>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card space-y-4 lg:col-span-2">
          <h2 className="text-xl font-black">Customer & Reference</h2>
          <label className="block">
            <span className="section-label">Mapped Cin7 Customer</span>
            <select className="input mt-1" value={order.customerId || ''} disabled={!canEdit} onChange={(event) => setOrder({ ...order, customerId: event.target.value || null })}>
              <option value="">No customer selected</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.email ? ` - ${customer.email}` : ''}</option>)}
            </select>
            <p className="mt-1 text-xs text-slate-500">AI read customer as: {order.customerText || 'Not found'}</p>
          </label>
          <label className="block">
            <span className="section-label">PO / Reference</span>
            <input className="input mt-1" value={order.poNumber || ''} disabled={!canEdit} onChange={(event) => setOrder({ ...order, poNumber: event.target.value })} />
          </label>
        </section>

        <aside className="card space-y-3">
          <h2 className="text-xl font-black">Actions</h2>
          {order.status === 'CREATED' || order.cin7SaleId ? <div className="soft-panel text-sm text-emerald-800">This order already exists in Cin7. Duplicate creation is blocked.</div> : <div className="soft-panel text-sm text-slate-700">Save corrections, send to Cin7, or delete if this is not a real order.</div>}
          <button className="btn-secondary w-full" disabled={!canEdit || isSaving} onClick={saveReview}>{isSaving ? 'Saving...' : 'Save Review Changes'}</button>
          <button className="btn-success w-full" disabled={!canCreate} onClick={createCin7Order}>{order.status === 'CREATED' || order.cin7SaleId ? 'Already Created in Cin7' : isCreating ? 'Creating...' : 'Create/Send to Cin7'}</button>
          <button className="btn-danger w-full" disabled={!canEdit} onClick={() => setShowDelete(true)}>Delete - Not a Real Order</button>
        </aside>
      </div>

      <section className="card space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><h2 className="text-xl font-black">Order Lines</h2><p className="text-sm text-slate-500">Select the exact SKU that represents the customer’s requested unit, box, carton, or pack.</p></div>
          <input className="input md:max-w-sm" placeholder="Search products by SKU or name..." value={productSearch} onChange={(event) => setProductSearch(event.target.value)} />
        </div>
        <div className="space-y-4">
          {order.lines.map((line) => (
            <div key={line.id} className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div><p className="text-sm font-semibold text-slate-500">Customer wrote</p><p className="font-bold text-slate-950">{line.rawProductText}</p></div>
                <span className={line.confidence >= 0.9 ? 'badge badge-green' : line.confidence >= 0.7 ? 'badge badge-yellow' : 'badge badge-red'}>{Math.round(line.confidence * 100)}% confidence</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="md:col-span-2"><span className="section-label">Mapped Product / SKU</span><select className="input mt-1" value={line.productId || ''} disabled={!canEdit} onChange={(event) => updateLine(line.id, { productId: event.target.value || null })}><option value="">No product selected</option>{filteredProducts.map((product) => <option key={product.id} value={product.id}>{product.sku ? `${product.sku} - ` : ''}{product.name}</option>)}</select></label>
                <label><span className="section-label">Quantity</span><input className="input mt-1" type="number" value={line.quantity} disabled={!canEdit} onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) })} /></label>
              </div>
              <p className="mt-2 text-xs text-slate-500">Current match: {line.sku || 'No SKU'} - {line.productName || 'No product'} | {line.status}</p>
            </div>
          ))}
        </div>
      </section>

      {message && <div className={`card ${messageType === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : messageType === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'text-slate-700'}`}>{message}</div>}
      {order.error && <div className="card border-rose-200 bg-rose-50 text-rose-800"><b>Last error:</b> {order.error}</div>}

      <section className="card"><h2 className="text-xl font-black">Original Email</h2><pre className="mt-3 whitespace-pre-wrap rounded-3xl bg-slate-950 p-5 text-sm text-slate-100 shadow-inner">{order.originalText}</pre></section>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-6 backdrop-blur-sm">
          <div className="card max-w-xl space-y-4">
            <h2 className="text-2xl font-black text-slate-950">Delete this review order?</h2>
            <p className="text-sm text-slate-600">This will remove the review order and save your feedback so AI can learn not to classify similar emails as orders in the future.</p>
            <label className="block"><span className="section-label">Why is this not a real order?</span><textarea className="input mt-1 min-h-[120px]" value={deleteComment} onChange={(event) => setDeleteComment(event.target.value)} placeholder="Example: This is a supplier purchase order, not a customer sales order. Do not process similar emails." /></label>
            <div className="flex justify-end gap-2"><button className="btn-secondary" onClick={() => setShowDelete(false)} disabled={isDeleting}>Cancel</button><button className="btn-danger" onClick={deleteOrder} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete and Save Feedback'}</button></div>
          </div>
        </div>
      )}
    </main>
  );
}
