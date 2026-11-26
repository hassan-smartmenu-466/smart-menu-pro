'use client';
import { useState } from 'react';

export default function QrView() {
  const [table, setTable] = useState('');

  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-2">
      <div className="card p-6 text-center">
        <h2 className="font-semibold text-gold-300">Menu QR code</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/api/qr?target=menu" alt="Menu QR code" className="mx-auto mt-4 w-56 rounded-2xl border border-ink-700" />
        <a href="/api/qr?target=menu" download="menu-qr.png" className="btn-gold mt-4 px-5 py-2 text-sm">Download PNG</a>
      </div>
      <div className="card p-6 text-center">
        <h2 className="font-semibold text-gold-300">Table QR code</h2>
        <div className="mt-3 flex justify-center gap-2">
          <input className="input w-28 py-2 text-center text-sm" placeholder="Table #" value={table} onChange={(e) => setTable(e.target.value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 10))} />
        </div>
        {table ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/qr?target=table&table=${encodeURIComponent(table)}`} alt={`QR for table ${table}`} className="mx-auto mt-4 w-56 rounded-2xl border border-ink-700" />
            <a href={`/api/qr?target=table&table=${encodeURIComponent(table)}`} download={`table-${table}-qr.png`} className="btn-gold mt-4 px-5 py-2 text-sm">Download PNG</a>
          </>
        ) : (
          <div className="mx-auto mt-4 flex h-56 w-56 items-center justify-center rounded-2xl border border-dashed border-ink-600 text-sm text-ink-500">
            Enter a table number
          </div>
        )}
      </div>
    </div>
  );
}
