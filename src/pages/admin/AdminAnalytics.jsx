import { useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useCurrency } from '../../context/CurrencyContext';
import { isSampleProduct } from '../../utils/catalog';
import { getCustomerKey, getOrderAmount, getOrderDate, isPaidOrder } from '../../utils/adminData';
import { TrendingUp, ShoppingBag, Users, Package, DollarSign, RotateCcw, AlertCircle } from 'lucide-react';

const PERIOD_OPTIONS = [
  { days: 7, label: '7 Days' },
  { days: 30, label: '30 Days' },
  { days: 90, label: '90 Days' },
];
const COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#f59e0b', '#16a34a', '#e11d48'];

function sumPaid(orders) {
  return orders.filter(isPaidOrder).reduce((sum, order) => sum + getOrderAmount(order), 0);
}

export default function AdminAnalytics() {
  const { orders = [], adminProducts = [] } = useStore();
  const { format } = useCurrency();
  const [days, setDays] = useState(30);
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousStart = new Date(start.getTime() - days * 24 * 60 * 60 * 1000);

  const data = useMemo(() => {
    const dated = orders.map(order => ({ order, date: getOrderDate(order) })).filter(row => row.date);
    const current = dated.filter(row => row.date >= start && row.date <= now).map(row => row.order);
    const previous = dated.filter(row => row.date >= previousStart && row.date < start).map(row => row.order);
    const paid = current.filter(isPaidOrder);
    const categories = new Map();
    paid.forEach(order => (order.items || []).forEach(item => {
      const product = item.product || {};
      const category = String(product.category || '').trim();
      if (!category) return;
      categories.set(category, (categories.get(category) || 0) + Number(product.price || item.price || 0) * Number(item.qty || 1));
    }));
    const countries = new Map();
    current.forEach(order => {
      const country = String(order.country || '').trim();
      if (country) countries.set(country, (countries.get(country) || 0) + 1);
    });
    const bucketMs = (now.getTime() - start.getTime()) / 7;
    const chart = Array.from({ length: 7 }, (_, index) => {
      const bucketStart = new Date(start.getTime() + bucketMs * index);
      const bucketEnd = index === 6 ? now : new Date(start.getTime() + bucketMs * (index + 1));
      const rows = current.filter(order => {
        const date = getOrderDate(order);
        return date >= bucketStart && (index === 6 ? date <= bucketEnd : date < bucketEnd);
      });
      return { start: bucketStart, orders: rows.length, revenue: sumPaid(rows) };
    });
    const paidOrderCount = paid.length;
    const cancelledOrRefunded = current.filter(order => ['cancelled', 'canceled', 'refunded'].includes(String(order.status || '').toLowerCase())).length;
    return {
      current,
      previous,
      paid,
      paidRevenue: sumPaid(current),
      customers: new Set(current.map(getCustomerKey)).size,
      productsActive: adminProducts.filter(product => !isSampleProduct(product) && !['Draft', 'Out of Stock'].includes(product.status)).length,
      averagePaidOrder: paidOrderCount ? sumPaid(current) / paidOrderCount : 0,
      refundRate: current.length ? (cancelledOrRefunded / current.length) * 100 : 0,
      chart,
      categories: [...categories].map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue),
      countries: [...countries].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6),
    };
  }, [orders, adminProducts, days, start.getTime(), previousStart.getTime(), now.getTime()]);

  const previousRevenue = sumPaid(data.previous);
  const revenueChange = previousRevenue > 0 ? ((data.paidRevenue - previousRevenue) / previousRevenue) * 100 : null;
  const previousOrderCount = data.previous.length;
  const orderChange = previousOrderCount > 0 ? ((data.current.length - previousOrderCount) / previousOrderCount) * 100 : null;
  const maxRevenue = Math.max(...data.chart.map(bucket => bucket.revenue), 1);
  const categoryTotal = data.categories.reduce((sum, item) => sum + item.revenue, 0);

  const metrics = [
    { label: 'Verified revenue', value: format(data.paidRevenue), change: revenueChange, icon: DollarSign, color: '#eff6ff', iconColor: '#2563eb' },
    { label: 'Orders', value: String(data.current.length), change: orderChange, icon: ShoppingBag, color: '#f0fdf4', iconColor: '#16a34a' },
    { label: 'Customers with orders', value: String(data.customers), change: null, icon: Users, color: '#faf5ff', iconColor: '#7c3aed' },
    { label: 'Published products', value: String(data.productsActive), change: null, icon: Package, color: '#fff7ed', iconColor: '#f59e0b' },
    { label: 'Average paid order', value: format(data.averagePaidOrder), change: null, icon: TrendingUp, color: '#f0fdfa', iconColor: '#0891b2' },
    { label: 'Cancelled / refunded', value: `${data.refundRate.toFixed(1)}%`, change: null, icon: RotateCcw, color: '#fef2f2', iconColor: '#ef4444' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div><h2 style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', margin: 0 }}>Analytics</h2><p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>Calculated from real orders and products saved in your store.</p></div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{PERIOD_OPTIONS.map(option => <button key={option.days} onClick={() => setDays(option.days)} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: days === option.days ? '#2563eb' : '#fff', color: days === option.days ? '#fff' : '#374151', border: `1px solid ${days === option.days ? '#2563eb' : '#e2e8f0'}` }}>{option.label}</button>)}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        {metrics.map(metric => <div key={metric.label} style={{ background: '#fff', borderRadius: 13, border: '1px solid #e8edf3', padding: '15px 16px' }}><div style={{ width: 35, height: 35, borderRadius: 9, background: metric.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><metric.icon size={16} color={metric.iconColor} /></div><div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>{metric.value}</div><div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>{metric.label}</div>{metric.change !== null && <div style={{ fontSize: 10, color: metric.change >= 0 ? '#16a34a' : '#dc2626', marginTop: 4 }}>{metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change).toFixed(1)}% vs previous {days} days</div>}</div>)}
      </div>

      <section style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}><div><div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Order activity</div><div style={{ fontSize: 11, color: '#94a3b8' }}>Seven equal time windows · verified revenue excludes unpaid and refunded orders</div></div><div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#64748b' }}><span><i style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: '#2563eb', marginRight: 5 }} />Verified revenue</span><span><i style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: '#c7d2fe', marginRight: 5 }} />Orders</span></div></div>
        {data.current.length ? <><div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 150 }}>{data.chart.map((bucket, index) => <div key={index} title={`${bucket.orders} orders · ${format(bucket.revenue)} verified`} style={{ flex: 1, display: 'flex', gap: 3, alignItems: 'flex-end', height: '100%', justifyContent: 'center' }}><div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}><div style={{ width: '100%', minHeight: bucket.revenue ? 4 : 0, height: `${bucket.revenue / maxRevenue * 100}%`, background: 'linear-gradient(180deg,#2563eb,#93c5fd)', borderRadius: '4px 4px 0 0' }} /></div><div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}><div style={{ width: '100%', minHeight: bucket.orders ? 4 : 0, height: `${bucket.orders / Math.max(...data.chart.map(item => item.orders), 1) * 100}%`, background: '#c7d2fe', borderRadius: '4px 4px 0 0' }} /></div></div>)}</div><div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>{data.chart.map((bucket, index) => <span key={index} style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', flex: 1 }}>{bucket.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>)}</div></> : <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No orders were recorded in this period.</div>}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <section style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', padding: '18px 20px' }}><div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 16 }}>Paid product value by category</div>{data.categories.length ? <><div style={{ display: 'flex', height: 12, borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>{data.categories.map((item, index) => <div key={item.name} style={{ width: `${item.revenue / categoryTotal * 100}%`, background: COLORS[index % COLORS.length] }} title={item.name} />)}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{data.categories.map((item, index) => <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[index % COLORS.length], flexShrink: 0 }} /><span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{item.name}</span><span style={{ fontSize: 11, color: '#64748b' }}>{(item.revenue / categoryTotal * 100).toFixed(1)}%</span><span style={{ fontSize: 11, color: '#0f172a', fontWeight: 700, minWidth: 72, textAlign: 'right' }}>{format(item.revenue)}</span></div>)}</div></> : <div style={{ color: '#94a3b8', fontSize: 12 }}>No paid product categories recorded for this period.</div>}</section>

        <section style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', padding: '18px 20px' }}><div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 16 }}>Orders by country</div>{data.countries.length ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{data.countries.map(country => <div key={country.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{country.name}</span><div style={{ flex: 2, height: 6, background: '#f1f5f9', borderRadius: 99 }}><div style={{ height: '100%', borderRadius: 99, background: '#2563eb', width: `${country.count / data.countries[0].count * 100}%` }} /></div><span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', minWidth: 28, textAlign: 'right' }}>{country.count}</span></div>)}</div> : <div style={{ color: '#94a3b8', fontSize: 12 }}>Country analytics will appear when checkout orders include a country.</div>}</section>
      </div>

      <section style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '15px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}><AlertCircle size={17} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} /><div><div style={{ fontWeight: 700, fontSize: 12, color: '#92400e' }}>Supplier performance is unavailable</div><div style={{ fontSize: 11, color: '#a16207', lineHeight: 1.6, marginTop: 3 }}>No supplier API is connected, so delivery scores, supplier return rates, and margins cannot be reported yet. No estimates are shown as real performance.</div></div></section>
    </div>
  );
}
