import { useCallback, useEffect, useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { api } from '../../utils/api';
import { Activity, CheckCircle, CreditCard, Database, Globe, Mail, RefreshCw, Server, Truck, AlertCircle } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://shoppercart-api.onrender.com/api')).replace(/\/$/, '');

function Status({ ok, children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 20, background: ok ? '#f0fdf4' : '#fff7ed', color: ok ? '#15803d' : '#c2410c', fontSize: 10, fontWeight: 700 }}>{ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />}{children}</span>;
}

function Card({ icon: Icon, title, status, ok, children }) {
  return <section style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', padding: '18px 20px', minWidth: 0 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 34, height: 34, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} color="#2563eb" /></span><h3 style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', margin: 0 }}>{title}</h3></div>{status && <Status ok={ok}>{status}</Status>}</div>{children}</section>;
}

export default function AdminSettings() {
  const { format } = useCurrency();
  const [health, setHealth] = useState(null);
  const [connections, setConnections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    const [healthResult, connectionResult] = await Promise.allSettled([api.getHealth(), api.getDropshipConnections()]);
    if (healthResult.status === 'fulfilled') setHealth(healthResult.value);
    if (connectionResult.status === 'fulfilled') setConnections(connectionResult.value);
    const errors = [healthResult, connectionResult].filter(result => result.status === 'rejected').map(result => result.reason?.message).filter(Boolean);
    if (errors.length) setError(errors.join(' '));
    setLoading(false);
  }, []);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  const databaseReady = health?.database === 'connected';
  const authReady = health?.authenticationConfigured === true;
  const supplier = connections?.supplier || {};
  const payment = connections?.payment || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div><h2 style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', margin: 0 }}>Store setup</h2><p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>Read-only status from the running API. Changes that require credentials belong in Render.</p></div>
        <button onClick={refreshStatus} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', background: '#fff', color: '#374151', border: '1px solid #e2e8f0', borderRadius: 9, fontWeight: 600, fontSize: 12, cursor: loading ? 'wait' : 'pointer' }}><RefreshCw size={14} />{loading ? 'Checking…' : 'Refresh status'}</button>
      </div>
      {error && <div role="alert" style={{ padding: '10px 12px', borderRadius: 9, background: '#fef2f2', color: '#b91c1c', fontSize: 12 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        <Card icon={Globe} title="Store identity" status="Configured" ok><div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>Shoppercart</div><a href="https://shoppercart.uhcacadamy.com" target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none' }}>shoppercart.uhcacadamy.com</a><div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>No phone number or business address is set in the application.</div></Card>

        <Card icon={Server} title="Backend API" status={loading ? 'Checking' : health?.status === 'ok' ? 'Online' : 'Unavailable'} ok={health?.status === 'ok'}><div style={{ fontSize: 11, color: '#334155', wordBreak: 'break-all' }}>{API_URL}</div><div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}><Status ok={databaseReady}>Database {health?.database || (loading ? 'checking' : 'unknown')}</Status><Status ok={authReady}>JWT {authReady ? 'configured' : loading ? 'checking' : 'not configured'}</Status></div>{health?.timestamp && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>Health checked {new Date(health.timestamp).toLocaleString()}</div>}</Card>

        <Card icon={CreditCard} title="Payments" status={payment.mode || (loading ? 'Checking' : 'Status unavailable')} ok={payment.serverVerification === true}><div style={{ fontSize: 12, color: '#334155' }}>{payment.setup || 'The backend has not reported payment configuration.'}</div><div style={{ fontSize: 10, color: '#64748b', marginTop: 8 }}>Server-side payment verification: {payment.serverVerification ? 'enabled' : 'not enabled'}</div></Card>

        <Card icon={Truck} title="Supplier fulfillment" status={supplier.connected ? (supplier.provider || 'Connected') : (loading ? 'Checking' : 'Not connected')} ok={supplier.connected === true}><div style={{ fontSize: 12, color: '#334155' }}>{supplier.setup || 'No supplier connection status is available.'}</div><div style={{ fontSize: 10, color: '#64748b', marginTop: 8 }}>Automatic purchasing: {supplier.automaticPurchasing ? 'enabled' : 'off'}</div></Card>

        <Card icon={Mail} title="Order email" status="Not configured" ok={false}><div style={{ fontSize: 12, color: '#334155' }}>No outbound email provider is connected to the backend, so order confirmation and shipping emails are not being sent automatically.</div></Card>

        <Card icon={Database} title="Current checkout rules" status="Backend defaults" ok><div style={{ display: 'grid', gap: 7, fontSize: 11, color: '#475569' }}><div>Shipping below $50: <strong>{format(4.99)}</strong></div><div>Shipping above $50: <strong>Free</strong></div><div>Checkout tax: <strong>8%</strong></div></div><div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>These values are currently set in backend code, not saved from this screen.</div></Card>
      </div>

      <section style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}><Activity size={16} color="#475569" style={{ marginTop: 1, flexShrink: 0 }} /><div><div style={{ fontWeight: 700, fontSize: 12, color: '#334155' }}>Why this page is read-only</div><div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6, marginTop: 4 }}>The current backend has no settings-save endpoint. The old form values stayed only in the browser and could make integrations look active when they were not. Configure secrets and service providers in the backend host, then this page will report their live status.</div></div></section>
    </div>
  );
}
