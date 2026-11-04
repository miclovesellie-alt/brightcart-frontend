import { useCallback, useEffect, useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { useStore } from '../../context/StoreContext';
import { api } from '../../utils/api';
import { Activity, CheckCircle, CreditCard, Database, Globe, Mail, MessageCircle, RefreshCw, Save, Server, Truck, AlertCircle } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://shoppercart-api.onrender.com/api')).replace(/\/$/, '');

function Status({ ok, children }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 20, background: ok ? '#f0fdf4' : '#fff7ed', color: ok ? '#15803d' : '#c2410c', fontSize: 10, fontWeight: 700 }}>{ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />}{children}</span>;
}

function Card({ icon: Icon, title, status, ok, children }) {
  return <section style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', padding: '18px 20px', minWidth: 0 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 34, height: 34, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} color="#2563eb" /></span><h3 style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', margin: 0 }}>{title}</h3></div>{status && <Status ok={ok}>{status}</Status>}</div>{children}</section>;
}

export default function AdminSettings() {
  const { format } = useCurrency();
  const { storeContacts, updateStoreContacts } = useStore();
  const [health, setHealth] = useState(null);
  const [connections, setConnections] = useState(null);
  const [emailService, setEmailService] = useState(null);
  const [form, setForm] = useState({
    ...storeContacts,
    notificationEmail: '',
    socials: { instagram: '', facebook: '', tiktok: '', youtube: '', x: '' },
    notifications: { customerOrderConfirmation: true, adminNewOrder: true, customerOrderStatus: true },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    const [healthResult, connectionResult, settingsResult] = await Promise.allSettled([api.getHealth(), api.getDropshipConnections(), api.getAdminStoreSettings()]);
    if (healthResult.status === 'fulfilled') setHealth(healthResult.value);
    if (connectionResult.status === 'fulfilled') setConnections(connectionResult.value);
    if (settingsResult.status === 'fulfilled') {
      setForm(current => ({ ...current, ...settingsResult.value.data, socials: { ...current.socials, ...(settingsResult.value.data?.socials || {}) }, notifications: { ...current.notifications, ...(settingsResult.value.data?.notifications || {}) } }));
      setEmailService(settingsResult.value.email || null);
    }
    const errors = [healthResult, connectionResult, settingsResult].filter(result => result.status === 'rejected').map(result => result.reason?.message).filter(Boolean);
    if (errors.length) setError(errors.join(' '));
    setLoading(false);
  }, []);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  const databaseReady = health?.database === 'connected';
  const authReady = health?.authenticationConfigured === true;
  const supplier = connections?.supplier || {};
  const payment = connections?.payment || {};

  const setField = (key, value) => { setSaved(false); setForm(current => ({ ...current, [key]: value })); };
  const setSocial = (key, value) => { setSaved(false); setForm(current => ({ ...current, socials: { ...current.socials, [key]: value } })); };
  const setNotification = (key, value) => { setSaved(false); setForm(current => ({ ...current, notifications: { ...current.notifications, [key]: value } })); };
  const saveSettings = async event => {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      const result = await updateStoreContacts(form);
      setForm(current => ({ ...current, ...result.data }));
      setEmailService(result.email || emailService);
      setSaved(true);
    } catch (saveFailure) {
      setSaveError(saveFailure.message || 'Could not save store contact settings.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { width: '100%', minWidth: 0, padding: '9px 11px', border: '1px solid #dbe3ed', borderRadius: 8, color: '#0f172a', background: '#fff', fontSize: 12, boxSizing: 'border-box' };
  const labelStyle = { display: 'grid', gap: 5, color: '#475569', fontSize: 11, fontWeight: 700 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div><h2 style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', margin: 0 }}>Store setup</h2><p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>Manage customer contact links, social pages, and order email notifications.</p></div>
        <button onClick={refreshStatus} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', background: '#fff', color: '#374151', border: '1px solid #e2e8f0', borderRadius: 9, fontWeight: 600, fontSize: 12, cursor: loading ? 'wait' : 'pointer' }}><RefreshCw size={14} />{loading ? 'Checking…' : 'Refresh status'}</button>
      </div>
      {error && <div role="alert" style={{ padding: '10px 12px', borderRadius: 9, background: '#fef2f2', color: '#b91c1c', fontSize: 12 }}>{error}</div>}

      <form onSubmit={saveSettings} style={{ display: 'grid', gap: 14, padding: 18, background: '#fff', border: '1px solid #e8edf3', borderRadius: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Globe size={17} color="#f97316" /><div><h3 style={{ margin: 0, color: '#0f172a', fontSize: 14 }}>Customer support and social links</h3><p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 11 }}>These links appear in the storefront footer.</p></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
          <label style={labelStyle}>Support email<input type="email" value={form.supportEmail || ''} onChange={event => setField('supportEmail', event.target.value)} placeholder="support@example.com" style={inputStyle} /></label>
          <label style={labelStyle}>WhatsApp number with country code<input type="tel" value={form.whatsappNumber || ''} onChange={event => setField('whatsappNumber', event.target.value)} placeholder="233XXXXXXXXX" style={inputStyle} /></label>
          {[
            ['instagram', 'Instagram URL'], ['facebook', 'Facebook URL'], ['tiktok', 'TikTok URL'], ['youtube', 'YouTube URL'], ['x', 'X URL'],
          ].map(([key, label]) => <label key={key} style={labelStyle}>{label}<input type="url" value={form.socials?.[key] || ''} onChange={event => setSocial(key, event.target.value)} placeholder="https://" style={inputStyle} /></label>)}
        </div>

        <div style={{ height: 1, background: '#edf1f6' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Mail size={17} color="#f97316" /><div><h3 style={{ margin: 0, color: '#0f172a', fontSize: 14 }}>Email notifications</h3><p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 11 }}>Choose when customers and your team receive order emails.</p></div></div>
        <label style={labelStyle}>Admin notification inbox<input type="email" value={form.notificationEmail || ''} onChange={event => setField('notificationEmail', event.target.value)} placeholder="orders@example.com" style={inputStyle} /></label>
        <div style={{ display: 'grid', gap: 9 }}>
          {[
            ['customerOrderConfirmation', 'Send an order confirmation to the customer'],
            ['adminNewOrder', 'Email the admin inbox when an order is placed'],
            ['customerOrderStatus', 'Email the customer when their order status changes'],
          ].map(([key, label]) => <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#334155', fontSize: 12, cursor: 'pointer' }}><input type="checkbox" checked={Boolean(form.notifications?.[key])} onChange={event => setNotification(key, event.target.checked)} />{label}</label>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <Status ok={emailService?.configured === true}>{emailService?.configured ? `Email ready via ${emailService.provider}` : 'Email provider needs setup'}</Status>
          <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: saving ? 'wait' : 'pointer' }}><Save size={14} />{saving ? 'Saving…' : 'Save storefront settings'}</button>
        </div>
        {saveError && <div role="alert" style={{ color: '#b91c1c', fontSize: 12 }}>{saveError}</div>}
        {saved && <div role="status" style={{ color: '#15803d', fontSize: 12 }}>Storefront links and notification preferences saved.</div>}
        {!emailService?.configured && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#92400e', background: '#fffbeb', padding: '10px 12px', borderRadius: 8, fontSize: 11, lineHeight: 1.5 }}><MessageCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />To send emails, add RESEND_API_KEY and EMAIL_FROM to the backend hosting environment. Keep the API key on the backend.</div>}
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        <Card icon={Globe} title="Store identity" status={form.supportEmail || form.whatsappNumber ? 'Contact set' : 'Add contact'} ok={Boolean(form.supportEmail || form.whatsappNumber)}><div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>Shoppercart</div><a href="https://shoppercart.uhcacadamy.com" target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#c2410c', textDecoration: 'none' }}>shoppercart.uhcacadamy.com</a>{form.supportEmail && <div style={{ fontSize: 10, color: '#64748b', marginTop: 8 }}>Support email: {form.supportEmail}</div>}{form.whatsappNumber && <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>WhatsApp: +{form.whatsappNumber}</div>}</Card>

        <Card icon={Server} title="Backend API" status={loading ? 'Checking' : health?.status === 'ok' ? 'Online' : 'Unavailable'} ok={health?.status === 'ok'}><div style={{ fontSize: 11, color: '#334155', wordBreak: 'break-all' }}>{API_URL}</div><div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}><Status ok={databaseReady}>Database {health?.database || (loading ? 'checking' : 'unknown')}</Status><Status ok={authReady}>JWT {authReady ? 'configured' : loading ? 'checking' : 'not configured'}</Status></div>{health?.timestamp && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>Health checked {new Date(health.timestamp).toLocaleString()}</div>}</Card>

        <Card icon={CreditCard} title="Payments" status={payment.mode || (loading ? 'Checking' : 'Status unavailable')} ok={payment.serverVerification === true}><div style={{ fontSize: 12, color: '#334155' }}>{payment.setup || 'The backend has not reported payment configuration.'}</div><div style={{ fontSize: 10, color: '#64748b', marginTop: 8 }}>Server-side payment verification: {payment.serverVerification ? 'enabled' : 'not enabled'}</div></Card>

        <Card icon={Truck} title="Supplier fulfillment" status={supplier.connected ? (supplier.provider || 'Connected') : (loading ? 'Checking' : 'Not connected')} ok={supplier.connected === true}><div style={{ fontSize: 12, color: '#334155' }}>{supplier.setup || 'No supplier connection status is available.'}</div><div style={{ fontSize: 10, color: '#64748b', marginTop: 8 }}>Automatic purchasing: {supplier.automaticPurchasing ? 'enabled' : 'off'}</div></Card>

        <Card icon={Mail} title="Order email" status={emailService?.configured ? 'Ready' : 'Needs setup'} ok={emailService?.configured === true}><div style={{ fontSize: 12, color: '#334155' }}>{emailService?.configured ? `Sending through ${emailService.provider} from ${emailService.sender}.` : 'Add RESEND_API_KEY and EMAIL_FROM to the backend host before notification emails can be delivered.'}</div></Card>

        <Card icon={Database} title="Current checkout rules" status="Backend defaults" ok><div style={{ display: 'grid', gap: 7, fontSize: 11, color: '#475569' }}><div>Shipping below $50: <strong>{format(4.99)}</strong></div><div>Shipping above $50: <strong>Free</strong></div><div>Checkout tax: <strong>8%</strong></div></div><div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>These values are currently set in backend code, not saved from this screen.</div></Card>
      </div>

      <section style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}><Activity size={16} color="#475569" style={{ marginTop: 1, flexShrink: 0 }} /><div><div style={{ fontWeight: 700, fontSize: 12, color: '#334155' }}>Email provider setup</div><div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6, marginTop: 4 }}>Create a Resend API key, verify the sender domain, then set RESEND_API_KEY and EMAIL_FROM in the backend host. Once configured, order confirmation, admin new-order, and order-status emails use the preferences above.</div></div></section>
    </div>
  );
}
