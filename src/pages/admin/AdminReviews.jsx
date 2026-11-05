import { useEffect, useMemo, useState } from 'react';
import { Check, MessageSquareText, RefreshCw, Search, Star, X } from 'lucide-react';
import { api } from '../../utils/api';
import { useStore } from '../../context/StoreContext';

const statusTone = {
  pending: { color: '#fbbf24', background: 'rgba(245,158,11,.12)' },
  approved: { color: '#4ade80', background: 'rgba(34,197,94,.12)' },
  rejected: { color: '#f87171', background: 'rgba(239,68,68,.12)' },
};

export default function AdminReviews() {
  const { refreshAdminProducts } = useStore();
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadReviews() {
    setLoading(true);
    setError('');
    try {
      const result = await api.getAdminReviews('all');
      setReviews(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || 'Could not load customer reviews.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReviews(); }, []);

  const visible = useMemo(() => reviews.filter(review => {
    const query = search.trim().toLowerCase();
    const matchesStatus = status === 'all' || review.status === status;
    const matchesText = !query || `${review.productName || ''} ${review.customerName || ''} ${review.title || ''} ${review.body || ''} ${review.orderId || ''}`.toLowerCase().includes(query);
    return matchesStatus && matchesText;
  }), [reviews, search, status]);

  async function moderate(review, nextStatus) {
    setActionId(String(review._id || review.id));
    setError('');
    setNotice('');
    try {
      const result = await api.moderateReview(review._id || review.id, nextStatus);
      setReviews(previous => previous.map(item => String(item._id || item.id) === String(review._id || review.id) ? { ...item, ...result.data } : item));
      if (nextStatus === 'approved') {
        await refreshAdminProducts().catch(() => {});
        setNotice('Review approved and the product rating has been recalculated from approved customer reviews.');
      } else setNotice('Review rejected. It will not appear in the storefront or product rating.');
    } catch (err) {
      setError(err.message || 'Could not update the review.');
    } finally {
      setActionId('');
    }
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px clamp(16px, 3vw, 32px)', color: '#e2e8f0', background: '#0a0a0f' }}>
      <div style={{ maxWidth: 1050, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
          <div><h1 style={{ color: '#fff', fontSize: 23, margin: 0 }}>Customer reviews</h1><p style={{ color: '#8892a4', fontSize: 13, margin: '6px 0 0' }}>Only reviews tied to a verified paid order can be submitted. Approval publishes them and updates the product rating.</p></div>
          <button onClick={loadReviews} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid rgba(255,255,255,.12)', borderRadius: 9, padding: '9px 12px', background: '#111118', color: '#e2e8f0', cursor: 'pointer' }}><RefreshCw size={14} /> Refresh</button>
        </div>

        {error && <div role="alert" style={{ marginBottom: 14, padding: 11, borderRadius: 9, color: '#fecaca', background: 'rgba(127,29,29,.28)', border: '1px solid rgba(248,113,113,.25)', fontSize: 12 }}>{error}</div>}
        {notice && <div role="status" style={{ marginBottom: 14, padding: 11, borderRadius: 9, color: '#bbf7d0', background: 'rgba(20,83,45,.25)', border: '1px solid rgba(74,222,128,.22)', fontSize: 12 }}>{notice}</div>}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <label style={{ position: 'relative', flex: '1 1 260px' }}><Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#64748b' }} /><input aria-label="Search reviews" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search product, customer, or review…" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid rgba(255,255,255,.1)', borderRadius: 9, padding: '9px 11px 9px 32px', background: '#111118', color: '#fff' }} /></label>
          <select aria-label="Filter reviews by status" value={status} onChange={event => setStatus(event.target.value)} style={{ minWidth: 145, border: '1px solid rgba(255,255,255,.1)', borderRadius: 9, padding: '9px 11px', background: '#111118', color: '#fff' }}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All reviews</option></select>
        </div>

        {loading ? <div style={{ padding: 34, textAlign: 'center', color: '#8892a4' }}>Loading reviews…</div>
          : !visible.length ? <div style={{ padding: 38, textAlign: 'center', border: '1px dashed rgba(255,255,255,.12)', borderRadius: 12, color: '#8892a4' }}><MessageSquareText size={22} style={{ marginBottom: 9 }} /><div>No reviews match this view.</div></div>
            : <div style={{ display: 'grid', gap: 11 }}>{visible.map(review => {
              const id = String(review._id || review.id);
              const tone = statusTone[review.status] || statusTone.pending;
              return <article key={id} style={{ border: '1px solid rgba(255,255,255,.09)', borderRadius: 12, padding: 16, background: 'rgba(255,255,255,.025)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}><div style={{ color: '#fff', fontWeight: 750, fontSize: 14 }}>{review.productName}</div><div style={{ color: '#8892a4', fontSize: 11, marginTop: 4 }}>Verified buyer {review.customerName} · Order {review.orderId} · {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}</div></div>
                  <span style={{ borderRadius: 99, padding: '4px 9px', color: tone.color, background: tone.background, fontSize: 10, fontWeight: 800, textTransform: 'capitalize' }}>{review.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 13 }}><span style={{ display: 'inline-flex', color: '#f6c90e' }}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < Number(review.rating) ? '#f6c90e' : 'none'} />)}</span><strong style={{ color: '#fff', fontSize: 13 }}>{review.title}</strong></div>
                <p style={{ color: '#b7c1d0', fontSize: 13, lineHeight: 1.65, margin: '8px 0 12px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{review.body}</p>
                {review.status === 'pending' && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => moderate(review, 'rejected')} disabled={Boolean(actionId)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgba(248,113,113,.25)', borderRadius: 8, padding: '8px 11px', color: '#fca5a5', background: 'rgba(127,29,29,.16)', cursor: actionId ? 'wait' : 'pointer' }}><X size={14} /> Reject</button>
                  <button onClick={() => moderate(review, 'approved')} disabled={Boolean(actionId)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, borderRadius: 8, padding: '8px 11px', color: '#fff', background: '#f97316', cursor: actionId ? 'wait' : 'pointer' }}><Check size={14} /> {actionId === id ? 'Saving…' : 'Approve review'}</button>
                </div>}
                {review.status !== 'pending' && <small style={{ color: '#758096' }}>Moderated by {review.moderatedBy || 'admin'}</small>}
              </article>;
            })}</div>}
      </div>
    </div>
  );
}
