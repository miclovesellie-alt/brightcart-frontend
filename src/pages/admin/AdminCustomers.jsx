import { useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useCurrency } from '../../context/CurrencyContext';
import { aggregateCustomers, getOrderAmount, getOrderDate, isPaidOrder } from '../../utils/adminData';
import { Search, Mail, Phone, MapPin, X } from 'lucide-react';

function displayDate(date) {
  return date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

export default function AdminCustomers() {
  const { orders = [] } = useStore();
  const { format } = useCurrency();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('spend');
  const [selected, setSelected] = useState(null);

  const customers = useMemo(() => aggregateCustomers(orders).map(customer => ({
    ...customer,
    paidOrders: customer.orders.filter(isPaidOrder),
    paidOrderCount: customer.orders.filter(isPaidOrder).length,
    latestOrder: [...customer.orders].sort((a, b) => (getOrderDate(b)?.getTime() || 0) - (getOrderDate(a)?.getTime() || 0))[0],
  })), [orders]);

  const filtered = customers.filter(customer => `${customer.name} ${customer.email} ${customer.phone} ${customer.country}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'orders' ? b.orders.length - a.orders.length : sortBy === 'name' ? a.name.localeCompare(b.name) : b.paidSpend - a.paidSpend);
  const paidRevenue = customers.reduce((sum, customer) => sum + customer.paidSpend, 0);
  const paidOrderCount = customers.reduce((sum, customer) => sum + customer.paidOrderCount, 0);
  const averagePaidOrder = paidOrderCount ? paidRevenue / paidOrderCount : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', margin: 0 }}>Customers</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>Customer records are grouped from saved orders. Accounts without an order are not included.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        {[
          { label: 'Customers with orders', value: customers.length, icon: '👥', color: '#eff6ff' },
          { label: 'Verified paid spend', value: format(paidRevenue), icon: '💳', color: '#f0fdf4' },
          { label: 'Average paid order', value: format(averagePaidOrder), icon: '📊', color: '#faf5ff' },
        ].map(stat => <div key={stat.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8edf3', padding: '14px 16px' }}><div style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div><div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{stat.value}</div><div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{stat.label}</div></div>)}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}><Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search real order contacts…" style={{ width: '100%', padding: '7px 12px 7px 30px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} /></div>
        <select value={sortBy} onChange={event => setSortBy(event.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, color: '#374151', background: '#fff', cursor: 'pointer' }}><option value="spend">Sort: Paid spend</option><option value="orders">Sort: Order count</option><option value="name">Sort: Name A–Z</option></select>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', overflow: 'hidden' }}><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', minWidth: 680 }}>
        <thead><tr style={{ background: '#f8fafc' }}>{['Customer', 'Contact', 'Country', 'Orders', 'Verified paid spend', 'Last order', 'Action'].map(heading => <th key={heading} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{heading}</th>)}</tr></thead>
        <tbody>{!filtered.length ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>{customers.length ? 'No customers match your search.' : 'No customer order records yet. They will appear after customers place orders.'}</td></tr> : filtered.map(customer => <tr key={customer.id} style={{ borderTop: '1px solid #f8fafc' }}>
          <td style={{ padding: '11px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#2563eb', fontSize: 12, flexShrink: 0 }}>{customer.name.charAt(0).toUpperCase()}</div><div><div style={{ fontWeight: 700, color: '#0f172a' }}>{customer.name}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>First order {displayDate(customer.firstOrderDate)}</div></div></div></td>
          <td style={{ padding: '11px 14px' }}><div style={{ fontSize: 11, color: '#374151' }}>{customer.email || 'No email recorded'}</div>{customer.phone && <div style={{ fontSize: 10, color: '#94a3b8' }}>{customer.phone}</div>}</td>
          <td style={{ padding: '11px 14px', color: '#64748b', fontSize: 11 }}>{customer.country || 'Not provided'}</td>
          <td style={{ padding: '11px 14px', fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>{customer.orders.length}</td>
          <td style={{ padding: '11px 14px', fontWeight: 800, color: '#2563eb' }}>{format(customer.paidSpend)}</td>
          <td style={{ padding: '11px 14px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 11 }}>{displayDate(getOrderDate(customer.latestOrder))}</td>
          <td style={{ padding: '11px 14px' }}><button onClick={() => setSelected(customer)} style={{ padding: '4px 10px', borderRadius: 6, background: '#fff7ed', border: 'none', color: '#c2410c', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View</button></td>
        </tr>)}</tbody>
      </table></div></div>

      {selected && <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setSelected(null)} />
        <div style={{ position: 'relative', width: '100%', maxWidth: 420, background: '#fff', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}>
          <div style={{ padding: '20px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{selected.name}</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>Customer record from saved orders</div></div><button onClick={() => setSelected(null)} aria-label="Close customer details" style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}><X size={16} color="#64748b" /></button></div>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{[{ label: 'Orders', value: selected.orders.length }, { label: 'Verified paid spend', value: format(selected.paidSpend) }, { label: 'Average paid order', value: format(selected.paidOrderCount ? selected.paidSpend / selected.paidOrderCount : 0) }, { label: 'First order', value: displayDate(selected.firstOrderDate) }].map(stat => <div key={stat.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}><div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{stat.value}</div><div style={{ fontSize: 10, color: '#64748b' }}>{stat.label}</div></div>)}</div>
            <section><div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>CONTACT DETAILS</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[[Mail, selected.email || 'No email recorded'], [Phone, selected.phone || 'No phone recorded'], [MapPin, selected.country || 'No country recorded']].map(([Icon, label]) => <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: 9 }}><Icon size={13} color="#64748b" /><span style={{ fontSize: 12, color: '#374151' }}>{label}</span></div>)}</div>{selected.email && <a href={`mailto:${encodeURIComponent(selected.email)}`} style={{ display: 'inline-block', marginTop: 10, color: '#2563eb', fontSize: 12, textDecoration: 'none' }}>Email customer</a>}</section>
            <section><div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>ORDER HISTORY</div><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{selected.orders.slice().sort((a, b) => (getOrderDate(b)?.getTime() || 0) - (getOrderDate(a)?.getTime() || 0)).map(order => <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: '#f8fafc', borderRadius: 9, padding: '10px 12px' }}><div><div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{order.id}</div><div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{displayDate(getOrderDate(order))} · {order.status}</div></div><div style={{ textAlign: 'right' }}><div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>{format(getOrderAmount(order))}</div><div style={{ fontSize: 10, color: '#64748b' }}>{order.paymentStatus || 'No payment status'}</div></div></div>)}</div></section>
          </div>
        </div>
      </div>}
    </div>
  );
}
