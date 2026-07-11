'use client';

import { useEffect, useState } from 'react';

type Customer = { id: string; name: string; email?: string | null };
type Product = { id: string; sku?: string | null; name: string };
type OrderLine = { id: string; rawProductText: string; productId: string | null; productName: string | null; sku: string | null; quantity: number; uom: string | null; confidence: number; status: string };
type Order = { id: string; status: string; customerText: string | null; customerId: string | null; poNumber: string | null; originalText: string; lines: OrderLine[]; cin7SaleId?: string | null };

export default function OrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState('');

  async function loadOrder() {
    const response = await fetch(`/api/orders/${params.id}`);
    const data = await response.json();
    setOrder(data.order);
    setCustomers(data.customers || []);
    setProducts(data.products || []);
  }

  useEffect(() => { void loadOrder(); }, []);

  function updateLine(lineId: string, patch: Partial<OrderLine>) {
    if (!order) return;
    setOrder({ ...order, lines: order.lines.map((line) => line.id === lineId ? { ...line, ...patch } : line) });
  }

  async function saveReview() {
    if (!order) return;
    setMessage('Saving review...');
    const response = await fetch(`/api/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: order.customerId,
        poNumber: order.poNumber,
        lines: order.lines.map((line) => ({ id: line.id, productId: line.productId, quantity: line.quantity, uom: line.uom }))
      })
    });
    setMessage(await response.text());
    await loadOrder();
  }

  async function createCin7Order() {
    if (!order) return;
    setMessage('Creating Cin7 order...');
    const response = await fetch(`/api/orders/${order.id}/create-cin7`, { method: 'POST' });
    setMessage(await response.text());
    await loadOrder();
  }

  if (!order) return <p className="p-6">Loading...</p>;

  const canEdit = order.status !== 'CREATED';

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="card space-y-3">
        <h1 className="text-2xl font-bold">Review Order</h1>
        <p>Status: {order.status}</p>
        {order.cin7SaleId && <p>Cin7 Sale ID: {order.cin7SaleId}</p>}

        <label className="block">
          <span className="font-medium">Mapped Cin7 Customer</span>
          <select className="input mt-1" value={order.customerId || ''} disabled={!canEdit} onChange={(event) => setOrder({ ...order, customerId: event.target.value || null })}>
            <option value="">No customer selected</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.email ? ` - ${customer.email}` : ''}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="font-medium">PO / Reference</span>
          <input className="input mt-1" value={order.poNumber || ''} disabled={!canEdit} onChange={(event) => setOrder({ ...order, poNumber: event.target.value })} />
        </label>
      </div>

      <div className="card">
        <h2 className="font-bold mb-3">Lines</h2>
        <div className="space-y-4">
          {order.lines.map((line) => (
            <div key={line.id} className="border rounded-xl p-4 space-y-3">
              <p><b>Customer wrote:</b> {line.rawProductText}</p>
              <div className="grid md:grid-cols-3 gap-3">
                <label>
                  <span className="font-medium">Mapped Product</span>
                  <select className="input mt-1" value={line.productId || ''} disabled={!canEdit} onChange={(event) => updateLine(line.id, { productId: event.target.value || null })}>
                    <option value="">No product selected</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.sku ? `${product.sku} - ` : ''}{product.name}</option>)}
                  </select>
                </label>
                <label>
                  <span className="font-medium">Quantity</span>
                  <input className="input mt-1" type="number" value={line.quantity} disabled={!canEdit} onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) })} />
                </label>
                <label>
                  <span className="font-medium">UOM</span>
                  <input className="input mt-1" value={line.uom || ''} disabled={!canEdit} onChange={(event) => updateLine(line.id, { uom: event.target.value })} />
                </label>
              </div>
              <p className="text-sm text-slate-500">Current match: {line.sku} - {line.productName} | Confidence: {Math.round(line.confidence * 100)}% | {line.status}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          {canEdit && <button className="btn" onClick={saveReview}>Save Review Changes</button>}
          <button className="btn" onClick={createCin7Order}>Create/Send to Cin7</button>
        </div>
        <p className="mt-2 whitespace-pre-wrap">{message}</p>
      </div>

      <div className="card">
        <h2 className="font-bold">Original Email</h2>
        <pre className="whitespace-pre-wrap text-sm">{order.originalText}</pre>
      </div>
    </main>
  );
}
