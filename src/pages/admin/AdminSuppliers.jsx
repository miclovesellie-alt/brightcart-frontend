import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { api } from '../../utils/api';
import { AlertCircle, CheckCircle, ExternalLink, RefreshCw, ShieldCheck, Truck } from 'lucide-react';

export default function AdminSuppliers() {
  const { navigate } = useStore();
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadConnection = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setConnection(await api.getDropshipConnections());
    } catch (err) {
      setError(err.message || 'Could not read supplier connection settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConnection(); }, [loadConnection]);

  const supplier = connection?.supplier || {};
  const isConnected = supplier.connected === true;
  const cards = [
    { label: 'Supplier connection', value: loading ? 'Checking…' : isConnected ? (supplier.provider || 'Connected') : 'Not connected', icon: Truck, color: isConnected ? '#16a34a' : '#d97706' },
    { label: 'Purchasing mode', value: supplier.mode || 'Unavailable', icon: ShieldCheck, color: '#2563eb' },
    { label: 'Automatic purchasing', value: supplier.automaticPurchasing ? 'Enabled' : 'Off', icon: CheckCircle, color: supplier.automaticPurchasing ? '#16a34a' : '#64748b' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div><h2 style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', margin: 0 }}>Supplier setup</h2><p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>Live supplier status reported by the Shoppercart API.</p></div>
        <button onClick={loadConnection} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: '#fff', color: '#374151', border: '1px solid #e2e8f0', borderRadius: 9, fontWeight: 600, fontSize: 12, cursor: loading ? 'wait' : 'pointer' }}><RefreshCw size={14} /> Refresh status</button>
      </div>

      {error && <div role="alert" style={{ padding: '10px 12px', borderRadius: 9, background: '#fef2f2', color: '#b91c1c', fontSize: 12 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
        {cards.map(card => <div key={card.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8edf3', padding: '16px 18px' }}><card.icon size={19} color={card.color} style={{ marginBottom: 10 }} /><div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a' }}>{card.value}</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{card.label}</div></div>)}
      </div>

      <section style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {isConnected ? <CheckCircle size={20} color="#16a34a" /> : <AlertCircle size={20} color="#d97706" />}
          <div><h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>{loading ? 'Checking backend configuration' : isConnected ? 'Supplier provider connected' : 'No supplier API is configured'}</h3><p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, margin: '6px 0 0' }}>{loading ? 'Reading the current status from the backend.' : supplier.setup || (isConnected ? 'The backend reports an active supplier provider.' : 'Supplier sync and automatic order placement are unavailable. Manual research and purchase records can be used after payment verification.')}</p></div>
        </div>
        {connection?.database && <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 9, background: '#f8fafc', fontSize: 11, color: '#475569' }}>Backend database: <strong>{connection.database}</strong></div>}
        <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 10, background: '#f8fafc' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>To enable a real supplier connection</div>
          <p style={{ margin: 0, fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>Choose a supplier with an official API, implement its backend adapter, then add its credentials as Render environment variables. Credentials must stay on the backend; entering a key here would not connect a provider.</p>
        </div>
        <button onClick={() => navigate('admin-dropshipping')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 16, padding: '9px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Open product research <ExternalLink size={13} /></button>
      </section>
    </div>
  );
}
