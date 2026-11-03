import { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { useCurrency } from '../../context/CurrencyContext';
import { isSampleProduct } from '../../utils/catalog';
import { getOrderAmount, getOrderDate, getUniqueCustomerCount, isPaidOrder } from '../../utils/adminData';
import {
  DollarSign, ShoppingBag, Package, Users, Clock, CheckCircle,
  AlertCircle, ArrowRight, TrendingUp, Truck,
} from 'lucide-react';

const PALETTE = {
  Pending: '#f59e0b',
  'Pending payment verification': '#d97706',
  Processing: '#3b82f6',
  Shipped: '#7c3aed',
  Delivered: '#16a34a',
  Cancelled: '#ef4444',
  Canceled: '#ef4444',
  Refunded: '#ef4444',
};

function dateLabel(date) {
  return date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Date unavailable';
}

export default function AdminDashboard() {
  const { orders = [], adminProducts = [], user, navigate } = useStore();
  const { format } = useCurrency();

  const data = useMemo(() => {
    const datedOrders = [...orders].map(order => ({ order, date: getOrderDate(order) }))
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
    const paidOrders = datedOrders.filter(({ order }) => isPaidOrder(order));
    const paidRevenue = paidOrders.reduce((sum, { order }) => sum + getOrderAmount(order), 0);
    const now = new Date();
    const monthOrders = datedOrders.filter(({ date }) => date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth());
    const pendingCount = datedOrders.filter(({ order }) => ['pending', 'processing'].includes(String(order.status || '').toLowerCase())).length;
    const verificationCount = datedOrders.filter(({ order }) => order.paymentStatus === 'pending_verification').length;
    const realProducts = adminProducts.filter(product => !isSampleProduct(product));
    const liveProducts = realProducts.filter(product => !['Draft', 'Out of Stock'].includes(product.status));
    const lowStockProducts = realProducts.filter(product => product.status !== 'Draft' && Number(product.stock ?? 0) < 5);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const chart = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - index));
      const rows = paidOrders.filter(({ date }) => date && date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate());
      return {
        day,
        revenue: rows.reduce((sum, { order }) => sum + getOrderAmount(order), 0),
        orders: rows.length,
      };
    });

    const topProducts = new Map();
    paidOrders.forEach(({ order }) => {
      (order.items || []).forEach(item => {
        const product = item.product || {};
        const key = String(product.id ?? product.name ?? 'unknown');
        if (key === 'unknown') return;
        const current = topProducts.get(key) || { name: product.name || 'Product', units: 0, revenue: 0 };
        const quantity = Number(item.qty || 1);
        current.units += quantity;
        current.revenue += Number(product.price ?? item.price ?? 0) * quantity;
        topProducts.set(key, current);
      });
    });

    return {
      datedOrders,
      paidRevenue,
      paidOrders,
      monthOrders,
      pendingCount,
      verificationCount,
      realProducts,
      liveProducts,
      lowStockProducts,
      chart,
      topProducts: [...topProducts.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      customerCount: getUniqueCustomerCount(orders),
    };
  }, [orders, adminProducts]);

  const maxRevenue = Math.max(...data.chart.map(day => day.revenue), 1);
  const recentOrders = data.datedOrders.slice(0, 6);
  const attention = [];
  if (data.verificationCount) attention.push({
    title: 'Payment verification needed',
    detail: `${data.verificationCount} order${data.verificationCount === 1 ? '' : 's'} awaiting manual verification.`,
    color: '#d97706',
  });
  if (data.lowStockProducts.length) attention.push({
    title: 'Low stock',
    detail: `${data.lowStockProducts.length} product${data.lowStockProducts.length === 1 ? '' : 's'} have fewer than 5 units.`,
    color: '#dc2626',
  });

  const stats = [
    { label: 'Verified revenue', value: format(data.paidRevenue), note: 'Paid orders only', icon: DollarSign, color: '#eff6ff', iconColor: '#2563eb' },
    { label: 'Orders this month', value: String(data.monthOrders.length), note: 'Based on saved orders', icon: ShoppingBag, color: '#f0fdf4', iconColor: '#16a34a' },
    { label: 'Average paid order', value: format(data.paidOrders.length ? data.paidRevenue / data.paidOrders.length : 0), note: `${data.paidOrders.length} verified paid`, icon: TrendingUp, color: '#faf5ff', iconColor: '#7c3aed' },
    { label: 'Customers with orders', value: String(data.customerCount), note: 'Unique order contacts', icon: Users, color: '#fff7ed', iconColor: '#f59e0b' },
    { label: 'Published products', value: String(data.liveProducts.length), note: `${data.realProducts.length - data.liveProducts.length} drafts or unavailable`, icon: Package, color: '#f0fdfa', iconColor: '#0891b2' },
    { label: 'Awaiting fulfillment', value: String(data.pendingCount), note: 'Pending or processing', icon: Truck, color: '#fef2f2', iconColor: '#ef4444' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', margin: 0 }}>Welcome, {user?.name || 'Admin'}</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>Live activity from your Shoppercart store.</p>
        </div>
        <button onClick={() => navigate('admin-products')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Package size={14} /> Manage Products
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', padding: '16px 18px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <stat.icon size={18} color={stat.iconColor} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{stat.label}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{stat.note}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(260px,320px)', gap: 16 }}>
        <section style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div><div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Verified revenue</div><div style={{ fontSize: 11, color: '#94a3b8' }}>Last 7 days · paid orders only</div></div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Orders are counted separately</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
            {data.chart.map(day => (
              <div key={day.day.toISOString()} title={`${dateLabel(day.day)}: ${format(day.revenue)} · ${day.orders} paid orders`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 5, height: '100%' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb' }}>{day.revenue ? format(day.revenue) : ''}</span>
                <div style={{ width: '100%', minHeight: 3, height: `${Math.max(2, day.revenue / maxRevenue * 100)}%`, background: day.revenue ? 'linear-gradient(180deg,#2563eb,#93c5fd)' : '#e2e8f0', borderRadius: '4px 4px 0 0' }} />
                <span style={{ fontSize: 9, color: '#94a3b8' }}>{day.day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
            <div><div style={{ fontSize: 16, fontWeight: 800, color: '#2563eb' }}>{format(data.chart.reduce((sum, day) => sum + day.revenue, 0))}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>7-day verified revenue</div></div>
            <div><div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{data.chart.reduce((sum, day) => sum + day.orders, 0)}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>Paid orders</div></div>
            <div><div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>{data.lowStockProducts.length}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>Low-stock products</div></div>
          </div>
        </section>

        <section style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>Needs attention</div>
          {attention.length ? attention.map(item => (
            <div key={item.title} style={{ padding: '10px 12px', borderRadius: 10, background: '#fffbeb', display: 'flex', gap: 10, marginBottom: 8 }}>
              <AlertCircle size={15} color={item.color} style={{ flexShrink: 0, marginTop: 1 }} />
              <div><div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{item.title}</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.detail}</div></div>
            </div>
          )) : <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 0', color: '#64748b', fontSize: 12 }}><CheckCircle size={15} color="#16a34a" /> No payment or stock alerts right now.</div>}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: '#0f172a', marginBottom: 10 }}>Order fulfillment</div>
            {['Pending', 'Processing', 'Shipped', 'Delivered'].map(status => {
              const count = orders.filter(order => order.status === status).length;
              const total = Math.max(orders.length, 1);
              return <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PALETTE[status], flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#374151', flex: 1 }}>{status}</span>
                <div style={{ flex: 2, height: 5, background: '#f1f5f9', borderRadius: 99 }}><div style={{ height: '100%', borderRadius: 99, background: PALETTE[status], width: `${count / total * 100}%` }} /></div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', minWidth: 18, textAlign: 'right' }}>{count}</span>
              </div>;
            })}
          </div>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(260px,300px)', gap: 16 }}>
        <section style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Products sold</div>
            <button onClick={() => navigate('admin-products')} style={{ fontSize: 11, color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>Manage products <ArrowRight size={12} /></button>
          </div>
          {data.topProducts.length ? <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', minWidth: 360 }}>
            <thead><tr style={{ background: '#f8fafc' }}>{['Product', 'Units', 'Paid product value'].map(header => <th key={header} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b' }}>{header}</th>)}</tr></thead>
            <tbody>{data.topProducts.map(product => <tr key={product.name} style={{ borderTop: '1px solid #f8fafc' }}>
              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{product.name}</td><td style={{ padding: '10px 14px', color: '#374151' }}>{product.units}</td><td style={{ padding: '10px 14px', fontWeight: 700, color: '#2563eb' }}>{format(product.revenue)}</td>
            </tr>)}</tbody>
          </table></div> : <div style={{ padding: 28, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Paid product sales will appear here after payments are verified.</div>}
        </section>

        <section style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 12 }}>Recent orders</div>
          {recentOrders.length ? recentOrders.map(({ order, date }) => (
            <div key={order.id} style={{ display: 'flex', gap: 9, padding: '9px 0', borderBottom: '1px solid #f8fafc' }}>
              <Clock size={14} color={PALETTE[order.status] || '#64748b'} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 11, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.id} · {order.customer}</div><div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{dateLabel(date)} · {order.status}</div></div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{format(getOrderAmount(order))}</span>
            </div>
          )) : <div style={{ color: '#94a3b8', fontSize: 12, padding: '12px 0' }}>No orders have been placed yet.</div>}
          <button onClick={() => navigate('admin-orders')} style={{ marginTop: 12, padding: 0, color: '#2563eb', background: 'none', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View all orders <ArrowRight size={12} style={{ verticalAlign: 'middle' }} /></button>
        </section>
      </div>
    </div>
  );
}
