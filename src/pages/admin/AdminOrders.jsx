import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useCurrency } from '../../context/CurrencyContext';
import { getOrderAmount, getOrderDate } from '../../utils/adminData';
import { Search, X, Truck, Copy, CheckCheck } from 'lucide-react';

const STATUSES = ['All', 'Pending', 'Pending payment verification', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Canceled', 'Refunded'];
const STATUS_COLORS = {
  Pending: { bg: '#fffbeb', text: '#d97706', dot: '#f59e0b' },
  'Pending payment verification': { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  Processing: { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
  Shipped: { bg: '#f5f3ff', text: '#7c3aed', dot: '#8b5cf6' },
  Delivered: { bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e' },
  Cancelled: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
  Canceled: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
  Refunded: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
};
const NEXT_STATUS = { Pending: 'Processing', Processing: 'Shipped', Shipped: 'Delivered' };
const STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

function formatDate(order, options = {}) {
  const date = getOrderDate(order);
  return date ? date.toLocaleString(undefined, options) : '—';
}

export default function AdminOrders() {
  const { orders = [], updateOrder } = useStore();
  const { format } = useCurrency();
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState('');
  const [savingOrder, setSavingOrder] = useState('');
  const [error, setError] = useState('');

  const allOrders = [...orders].sort((a, b) => {
    if (sortBy === 'oldest') return (getOrderDate(a)?.getTime() || 0) - (getOrderDate(b)?.getTime() || 0);
    if (sortBy === 'total-asc') return getOrderAmount(a) - getOrderAmount(b);
    if (sortBy === 'total-desc') return getOrderAmount(b) - getOrderAmount(a);
    return (getOrderDate(b)?.getTime() || 0) - (getOrderDate(a)?.getTime() || 0);
  });
  const filtered = allOrders.filter(order => {
    const searchText = `${order.customer || ''} ${order.email || ''} ${order.id || ''}`.toLowerCase();
    return (filter === 'All' || order.status === filter) && searchText.includes(search.toLowerCase());
  });
  const counts = Object.fromEntries(STATUSES.map(status => [
    status,
    status === 'All' ? allOrders.length : allOrders.filter(order => order.status === status).length,
  ]));

  const advanceStatus = async order => {
    const status = NEXT_STATUS[order.status];
    if (!status) return;
    setSavingOrder(order.id);
    setError('');
    try {
      const saved = await updateOrder(order.id, { status });
      if (selected?.id === order.id) setSelected(saved);
    } catch (err) {
      setError(err.message || 'Could not update the order.');
    } finally {
      setSavingOrder('');
    }
  };

  const copyTracking = async text => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setError('Could not copy the tracking number on this device.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', margin: 0 }}>Orders</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>{allOrders.length} saved orders · {counts.Pending} pending fulfillment</p>
        </div>
      </div>
      {error && <div role="alert" style={{ padding: '10px 12px', borderRadius: 9, background: '#fef2f2', color: '#b91c1c', fontSize: 12 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select aria-label="Filter orders by status" value={filter} onChange={event => setFilter(event.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, color: '#374151', background: '#fff', cursor: 'pointer', minWidth: 200 }}>
          {STATUSES.map(status => <option key={status} value={status}>{status} ({counts[status]})</option>)}
        </select>
        <select aria-label="Sort orders" value={sortBy} onChange={event => setSortBy(event.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, color: '#374151', background: '#fff', cursor: 'pointer', minWidth: 150 }}>
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="total-desc">Total: high to low</option><option value="total-asc">Total: low to high</option>
        </select>
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search orders…" style={{ padding: '7px 12px 7px 30px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', width: 200 }} />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', minWidth: 750 }}>
          <thead><tr style={{ background: '#f8fafc' }}>{['Order ID', 'Customer', 'Date', 'Items', 'Total', 'Supplier', 'Status', 'Action'].map(heading => <th key={heading} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{heading}</th>)}</tr></thead>
          <tbody>
            {!filtered.length ? <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>{allOrders.length ? 'No orders match your filters.' : 'No saved orders yet. New checkout orders will appear here.'}</td></tr> : filtered.map(order => {
              const color = STATUS_COLORS[order.status] || { bg: '#f8fafc', text: '#64748b', dot: '#94a3b8' };
              const items = order.items || [];
              return <tr key={order.id} style={{ borderTop: '1px solid #f8fafc' }}>
                <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{order.id}</td>
                <td style={{ padding: '11px 14px' }}><div style={{ fontWeight: 600, color: '#0f172a' }}>{order.customer || 'Customer'}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>{order.email || ''}</div></td>
                <td style={{ padding: '11px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(order, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td style={{ padding: '11px 14px' }}><div style={{ display: 'flex', gap: 4 }}>{items.slice(0, 3).map((item, index) => <span key={index} style={{ fontSize: 12, color: '#64748b' }}>{item.product?.name || 'Product'}{item.variant?.color ? ` · ${item.variant.color}` : ''}{index < Math.min(items.length, 3) - 1 ? ',' : ''}</span>)}{items.length > 3 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{items.length - 3}</span>}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>{items.reduce((sum, item) => sum + Number(item.qty || 1), 0)} units</div></td>
                <td style={{ padding: '11px 14px', fontWeight: 800, color: '#0f172a' }}>{format(getOrderAmount(order))}</td>
                <td style={{ padding: '11px 14px', color: '#64748b' }}>{order.supplier || 'Not assigned'}</td>
                <td style={{ padding: '11px 14px' }}><span style={{ background: color.bg, color: color.text, borderRadius: 20, padding: '3px 10px', fontWeight: 700, fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: color.dot }} />{order.status}</span><div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{order.paymentStatus || 'Payment status unavailable'}</div></td>
                <td style={{ padding: '11px 14px' }}><div style={{ display: 'flex', gap: 6 }}><button onClick={() => setSelected(order)} style={{ padding: '4px 10px', borderRadius: 6, background: '#fff7ed', border: 'none', color: '#c2410c', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View</button>{NEXT_STATUS[order.status] && <button disabled={savingOrder === order.id} onClick={() => advanceStatus(order)} style={{ padding: '4px 10px', borderRadius: 6, background: '#f0fdf4', border: 'none', color: '#16a34a', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: savingOrder === order.id ? 0.6 : 1 }}>{savingOrder === order.id ? 'Saving…' : `→ ${NEXT_STATUS[order.status]}`}</button>}</div></td>
              </tr>;
            })}
          </tbody>
        </table></div>
      </div>

      {selected && <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setSelected(null)} />
        <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: '#fff', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)' }}>
          <div style={{ padding: '20px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{selected.id}</div><div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{formatDate(selected, { dateStyle: 'medium', timeStyle: 'short' })}</div></div><button onClick={() => setSelected(null)} aria-label="Close order details" style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}><X size={16} color="#64748b" /></button></div>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <section style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px' }}><div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>ORDER STATUS</div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><span style={{ background: (STATUS_COLORS[selected.status]?.bg || '#f1f5f9'), color: (STATUS_COLORS[selected.status]?.text || '#64748b'), borderRadius: 20, padding: '4px 14px', fontWeight: 700, fontSize: 12 }}>{selected.status}</span>{NEXT_STATUS[selected.status] && <button disabled={savingOrder === selected.id} onClick={() => advanceStatus(selected)} style={{ padding: '6px 12px', borderRadius: 8, background: '#f97316', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}><Truck size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Mark as {NEXT_STATUS[selected.status]}</button>}</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 10 }}>Payment: {selected.paymentStatus || 'Not recorded'}</div><div style={{ display: 'flex', alignItems: 'center', marginTop: 14 }}>{STEPS.map((status, index) => { const current = STEPS.indexOf(selected.status); const done = current >= index; return <div key={status} style={{ display: 'flex', alignItems: 'center', flex: 1 }}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}><div style={{ width: 20, height: 20, borderRadius: '50%', background: done ? '#2563eb' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>{done ? '✓' : ''}</div><span style={{ fontSize: 8, color: done ? '#2563eb' : '#94a3b8', fontWeight: 600 }}>{status}</span></div>{index < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: current > index ? '#2563eb' : '#e2e8f0', margin: '0 4px', marginBottom: 14 }} />}</div>; })}</div></section>

            <section><div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>CUSTOMER</div><div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}><div style={{ fontWeight: 700, color: '#0f172a' }}>{selected.customer || 'Customer'}</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{selected.email || 'No email recorded'}</div>{selected.phone && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{selected.phone}</div>}<div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{[selected.address, selected.city, selected.state, selected.country].filter(Boolean).join(', ') || 'No delivery address recorded'}</div></div></section>

            {selected.tracking && <section><div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>TRACKING NUMBER</div><div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#16a34a', fontWeight: 700 }}>{selected.tracking}</span><button onClick={() => copyTracking(selected.tracking)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: copied === selected.tracking ? '#16a34a' : '#64748b', fontSize: 11 }}>{copied === selected.tracking ? <CheckCheck size={13} /> : <Copy size={13} />}{copied === selected.tracking ? 'Copied!' : 'Copy'}</button></div></section>}

            <section><div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>ORDER ITEMS</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{(selected.items || []).map((item, index) => <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}><div style={{ flex: 1 }}><div style={{ fontWeight: 600, color: '#0f172a', fontSize: 12 }}>{item.product?.name || 'Product'}</div><div style={{ fontSize: 10, color: '#64748b' }}>{item.variant?.color ? `Color: ${item.variant.color} · ` : ''}Qty: {item.qty || 1}</div></div><div style={{ fontWeight: 700, color: '#2563eb', fontSize: 13 }}>{format((item.product?.price || item.price || 0) * (item.qty || 1))}</div></div>)}</div></section>

            <section style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#64748b' }}><span>Subtotal</span><span>{format(selected.subtotal ?? selected.total ?? 0)}</span></div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#64748b' }}><span>Shipping</span><span>{format(selected.shipping || 0)}</span></div>{selected.tax !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#64748b' }}><span>Tax</span><span>{format(selected.tax || 0)}</span></div>}<div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #e2e8f0', fontSize: 14, fontWeight: 800, color: '#0f172a' }}><span>Total</span><span>{format(getOrderAmount(selected))}</span></div></section>

            <section><div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>SUPPLIER FULFILLMENT</div><div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}><div style={{ fontWeight: 700, color: '#0f172a', fontSize: 12 }}>{selected.supplier || 'Supplier not assigned'}</div><div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>{selected.supplierPurchaseStatus === 'purchased' ? 'Supplier purchase recorded' : 'Manual supplier purchase is available after payment is verified.'}</div></div></section>
          </div>
        </div>
      </div>}
    </div>
  );
}
