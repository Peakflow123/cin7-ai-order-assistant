'use client';

import { useState } from 'react';

type Product = {
  id: string;
  sku?: string | null;
  name: string;
  barcode?: string | null;
  uom?: string | null;
};

export default function ProductSearchBox({ onSelect }: { onSelect: (product: Product) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/products/search?q=${encodeURIComponent(value)}`);
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    setResults(data.products || []);
  }

  return (
    <div className="relative">
      <input className="input" placeholder="Search SKU, product name, or barcode..." value={query} onChange={(event) => search(event.target.value)} />
      {loading && <p className="mt-1 text-xs text-slate-500">Searching...</p>}
      {results.length > 0 && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
          {results.map((product) => (
            <button key={product.id} type="button" className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-blue-50" onClick={() => { onSelect(product); setQuery(product.sku ? `${product.sku} - ${product.name}` : product.name); setResults([]); }}>
              <p className="font-bold text-slate-900">{product.sku || 'No SKU'} - {product.name}</p>
              <p className="text-xs text-slate-500">{product.barcode || ''} {product.uom ? `• ${product.uom}` : ''}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
