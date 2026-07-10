'use client';

import { useEffect, useState } from 'react';

type OrderLine = {
  id: string;
  rawProductText: string;
  productName: string | null;
  sku: string | null;
  quantity: number;
  uom: string | null;
  confidence: number;
  status: string;
};

type Order = {
  id: string;
  status: string;
  customerText: string | null;
  poNumber: string | null;
  originalText: string;
  lines: OrderLine[];
};

export default function OrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState('');

  async function loadOrder() {
    const response = await fetch(`/api/orders/${params.id}`);
    setOrder(await response.json());
  }

  useEffect(() => {
    void loadOrder();
  }, []);

  async function createCin7Order() {
    setMessage('Creating Cin7 order...');
    const response = await fetch(`/api/orders/${params.id}/create-cin7`, { method: 'POST' });
    setMessage(await response.text());
    await loadOrder();
  }

  if (!order) return <p className="p-6">Loading...</p>;

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="card">
        <h1 className="text-2xl font-bold">Review Order</h1>
        <p>Status: {order.status}</p>
        <p>Customer: {order.customerText}</p>
        <p>PO: {order.poNumber}</p>
      </div>
      <div className="card">
        <h2 className="font-bold mb-3">Lines</h2>
        {order.lines.map((line) => (
          <div key={line.id} className="border-b py-3">
            <p><b>Customer wrote:</b> {line.rawProductText}</p>
            <p><b>Matched:</b> {line.sku} - {line.productName}</p>
            <p><b>Qty:</b> {line.quantity} {line.uom || ''} | Confidence: {Math.round(line.confidence * 100)}% | {line.status}</p>
          </div>
        ))}
        <button className="btn mt-4" onClick={createCin7Order}>Create Draft Sale in Cin7</button>
        <p className="mt-2">{message}</p>
      </div>
      <div className="card">
        <h2 className="font-bold">Original Email</h2>
        <pre className="whitespace-pre-wrap text-sm">{order.originalText}</pre>
      </div>
    </main>
  );
}
