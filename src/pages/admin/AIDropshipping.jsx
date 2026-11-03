import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Check, CheckCircle2,
  ChevronRight, DollarSign, ExternalLink, Eye, Package, Plus, RefreshCw,
  Save, Search, ShieldCheck, Sparkles, Truck, X,
} from 'lucide-react';
import { api } from '../../utils/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useStore } from '../../context/StoreContext';
import ProductImageGallery from '../../components/ProductImageGallery';
import './dropshipping.css';

const NAV = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'research', label: 'Research', icon: Search },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'studio', label: 'Product studio', icon: Package },
  { id: 'fulfillment', label: 'Fulfillment', icon: Truck },
  { id: 'connections', label: 'Connections', icon: ShieldCheck },
];

const EMPTY_CANDIDATE = {
  productName: '', category: 'phone-accessories', sourceUrl: '', supplierName: '', supplierUrl: '',
  imageUrl: '', unitCost: '', shippingCost: '0', retailPrice: '', availableStock: '',
  shippingDays: '', verifiedFacts: '', variants: '',
};

const cardStyle = { background: '#fff', border: '1px solid #e8edf3', borderRadius: 14 };
const labelStyle = { display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '.08em', color: '#64748b', marginBottom: 6 };
const inputStyle = { width: '100%', minHeight: 40, border: '1px solid #dbe3ed', borderRadius: 9, padding: '9px 11px', color: '#0f172a', background: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box' };
const buttonStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: 0, borderRadius: 9, padding: '9px 13px', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' };
const secondaryStyle = { ...buttonStyle, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' };

function MetricCard({ label, value, note, icon: Icon, tone = 'blue' }) {
  const colors = { blue: ['#eff6ff', '#2563eb'], green: ['#ecfdf5', '#059669'], amber: ['#fffbeb', '#d97706'], violet: ['#f5f3ff', '#7c3aed'] };
  const [bg, fg] = colors[tone] || colors.blue;
  return (
    <article className="ds-metric" style={cardStyle}>
      <div className="ds-metric-icon" style={{ background: bg, color: fg }}><Icon size={18} /></div>
      <div className="ds-metric-label">{label}</div>
      <div className="ds-metric-value">{value}</div>
      <div className="ds-metric-note">{note}</div>
    </article>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '', help = '', ...props }) {
  return (
    <label className="ds-field">
      <span style={labelStyle}>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} {...props} />
      {help && <small>{help}</small>}
    </label>
  );
}

function Chart({ rows }) {
  if (!rows?.length) return <div className="ds-empty">No order records in this period yet.</div>;
  const width = 760;
  const height = 210;
  const values = rows.flatMap(row => [Number(row.orderValue || 0), Number(row.paidRevenue || 0)]);
  const max = Math.max(1, ...values);
  const points = key => rows.map((row, index) => {
    const x = rows.length === 1 ? width / 2 : (index / (rows.length - 1)) * width;
    const y = height - 14 - (Number(row[key] || 0) / max) * (height - 28);
    return `${x},${y}`;
  }).join(' ');
  const first = rows[0]?.date?.slice(5) || '';
  const middle = rows[Math.floor((rows.length - 1) / 2)]?.date?.slice(5) || '';
  const last = rows[rows.length - 1]?.date?.slice(5) || '';
  return (
    <div>
      <svg className="ds-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Order value and verified paid revenue by day">
        {[0, 1, 2, 3].map(line => <line key={line} x1="0" x2={width} y1={line * 60 + 15} y2={line * 60 + 15} stroke="#edf1f6" strokeDasharray="4 5" />)}
        <polyline points={points('orderValue')} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={points('paidRevenue')} fill="none" stroke="#10b981" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="ds-chart-axis"><span>{first}</span><span>{middle}</span><span>{last}</span></div>
      <div className="ds-chart-legend"><span><i className="ds-legend-blue" /> Order value (all recorded orders)</span><span><i className="ds-legend-green" /> Verified paid revenue</span></div>
    </div>
  );
}

function StatusPill({ children, tone = 'slate' }) {
  return <span className={`ds-pill ds-pill-${tone}`}>{children}</span>;
}

export default function AIDropshipping() {
  const { currency, rates, format } = useCurrency();
  const { adminProducts, orders, user, refreshAdminProducts, refreshAdminOrders, updateProduct } = useStore();
  const [section, setSection] = useState('overview');
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState(null);
  const [connections, setConnections] = useState(null);
  const [research, setResearch] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [candidateForm, setCandidateForm] = useState(EMPTY_CANDIDATE);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [duplicate, setDuplicate] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [draftChecks, setDraftChecks] = useState({ policyReviewed: false, inventoryVerified: false, contentReviewed: false });
  const [purchaseFormId, setPurchaseFormId] = useState(null);
  const [purchaseForm, setPurchaseForm] = useState({ supplierName: '', supplierOrderId: '', actualCost: '', tracking: '', note: '' });
  const [paymentConfirmId, setPaymentConfirmId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ paymentReference: '', verificationNote: '' });
  const [pricing, setPricing] = useState({ unitCost: '', shippingCost: '', paymentFee: '', platformFee: '', advertising: '0', target: '35', mode: 'margin', rounding: '1', minimumProfit: '0' });
  const [researchMessage, setResearchMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, status, candidates, loggedPurchases] = await Promise.all([
        api.getDropshipOverview(days), api.getDropshipConnections(), api.getResearch(), api.getSupplierPurchases(),
      ]);
      setOverview(summary);
      setConnections(status);
      setResearch(candidates.data || []);
      setPurchases(loggedPurchases.data || []);
    } catch (err) {
      setError(err.message || 'The dropshipping workspace could not load.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const metrics = overview?.metrics || {};
  const previous = overview?.previous || {};
  const confirmedRevenue = metrics.paidRevenue ? format(metrics.paidRevenue) : format(0);
  const periodChange = (current, before) => {
    const value = Number(current || 0);
    const prior = Number(before || 0);
    if (prior === 0) return value > 0 ? `New activity vs previous ${days} days` : 'No activity in either period';
    const percentage = ((value - prior) / prior) * 100;
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}% vs previous ${days} days`;
  };
  const toUsd = amount => Number(amount || 0) / (rates[currency] || 1);
  const pricingResult = useMemo(() => {
    const cost = Number(pricing.unitCost);
    const shipping = Number(pricing.shippingCost);
    const payment = Number(pricing.paymentFee);
    const platform = Number(pricing.platformFee);
    const advertising = Number(pricing.advertising);
    const target = Number(pricing.target);
    const rounding = Number(pricing.rounding);
    const minimumProfit = Number(pricing.minimumProfit);
    const fees = (payment + platform) / 100;
    const baseCost = cost + shipping + advertising;
    const inputsReady = [cost, shipping, payment, platform, advertising, target, rounding, minimumProfit].every(Number.isFinite)
      && cost >= 0 && shipping >= 0 && advertising >= 0 && payment >= 0 && platform >= 0 && fees < 1
      && target > 0 && target < 100 && rounding > 0 && minimumProfit >= 0;
    if (!inputsReady || pricing.unitCost === '' || pricing.shippingCost === '' || pricing.paymentFee === '' || pricing.platformFee === '') return null;
    const raw = pricing.mode === 'markup'
      ? (baseCost * (1 + target / 100)) / (1 - fees)
      : baseCost / (1 - fees - target / 100);
    if (!Number.isFinite(raw) || raw <= 0) return null;
    const breakEven = baseCost / (1 - fees);
    const recommended = Math.ceil(Math.max(raw, (baseCost + minimumProfit) / (1 - fees)) / rounding) * rounding;
    const grossProfit = recommended * (1 - fees) - baseCost;
    const grossMargin = recommended > 0 ? grossProfit / recommended * 100 : 0;
    return { recommended, breakEven, grossProfit, grossMargin, fees, baseCost };
  }, [pricing]);

  const onCandidateField = event => setCandidateForm(prev => ({ ...prev, [event.target.name]: event.target.value }));
  const onPricingField = event => setPricing(prev => ({ ...prev, [event.target.name]: event.target.value }));

  async function submitCandidate(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const variants = candidateForm.variants.split('\n').map(value => value.trim()).filter(Boolean).map(name => ({ name }));
      const result = await api.createResearch({
        productName: candidateForm.productName,
        category: candidateForm.category,
        sourceUrl: candidateForm.sourceUrl,
        supplierName: candidateForm.supplierName,
        supplierUrl: candidateForm.supplierUrl,
        imageUrl: candidateForm.imageUrl,
        unitCost: toUsd(candidateForm.unitCost),
        shippingCost: toUsd(candidateForm.shippingCost),
        retailPrice: toUsd(candidateForm.retailPrice),
        availableStock: Number(candidateForm.availableStock),
        shippingDays: candidateForm.shippingDays === '' ? null : Number(candidateForm.shippingDays),
        currency: 'USD',
        verifiedFacts: candidateForm.verifiedFacts.split('\n').map(value => value.trim()).filter(Boolean),
        variants,
      });
      setResearch(prev => [result.data, ...prev]);
      setCandidateForm(EMPTY_CANDIDATE);
      setNotice('Research record saved. Supplier facts are admin-entered and demand/competition signals remain unavailable.');
      setResearchMessage('');
      setSelectedCandidate(result.data);
      await loadOverviewOnly();
    } catch (err) {
      setError(err.message || 'Could not save this research record.');
    } finally {
      setSaving(false);
    }
  }

  async function loadOverviewOnly() {
    try { setOverview(await api.getDropshipOverview(days)); } catch { /* keep the last good snapshot */ }
  }

  async function generateContent(candidate) {
    setResearchMessage('');
    setError('');
    setSaving(true);
    try {
      const result = await api.generateProductContent(candidate._id);
      setResearch(prev => prev.map(item => String(item._id) === String(candidate._id) ? result.data : item));
      setSelectedCandidate(result.data);
      setNotice('Local model generated draft copy. Review every statement against the supplier source before importing.');
    } catch (err) {
      setResearchMessage(err.message || 'Local model is unavailable.');
    } finally {
      setSaving(false);
    }
  }

  async function importCandidate(candidate, updateExisting = false) {
    setSaving(true);
    setError('');
    setDuplicate(null);
    try {
      const result = await api.importResearch(candidate._id, updateExisting);
      setNotice(`${result.data.name} is now saved as a draft in Admin > Products. It is hidden from the storefront until reviewed and published.`);
      setSelectedCandidate(null);
      await refreshAdminProducts();
      await loadOverviewOnly();
    } catch (err) {
      if (err.status === 409 && err.details?.duplicate) setDuplicate({ candidate, product: err.details.duplicate });
      else setError(err.message || 'Could not import this product.');
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft() {
    if (!editingDraft) return;
    setSaving(true);
    setError('');
    try {
      await updateProduct({ ...editingDraft, price: toUsd(editingDraft.price), stock: Number(editingDraft.stock) });
      setNotice('Draft saved in the shared product catalog.');
      setEditingDraft(null);
      setDraftChecks({ policyReviewed: false, inventoryVerified: false, contentReviewed: false });
    } catch (err) {
      setError(err.message || 'Could not save the draft.');
    } finally {
      setSaving(false);
    }
  }

  async function publishDraft() {
    if (!editingDraft) return;
    setSaving(true);
    setError('');
    try {
      await updateProduct({ ...editingDraft, price: toUsd(editingDraft.price), stock: Number(editingDraft.stock) });
      const result = await api.publishDraft(editingDraft.id, draftChecks);
      setNotice(`${result.data.name} is live in the storefront catalog.`);
      setEditingDraft(null);
      setDraftChecks({ policyReviewed: false, inventoryVerified: false, contentReviewed: false });
      await refreshAdminProducts();
      await loadOverviewOnly();
    } catch (err) {
      setError(err.message || 'Publishing was blocked. Check required product, stock, and review fields.');
    } finally {
      setSaving(false);
    }
  }

  async function recordPurchase(order) {
    setSaving(true);
    setError('');
    try {
      await api.recordSupplierPurchase(order.id, { ...purchaseForm, actualCost: toUsd(purchaseForm.actualCost), currency: 'USD' });
      setPurchaseFormId(null);
      setPurchaseForm({ supplierName: '', supplierOrderId: '', actualCost: '', tracking: '', note: '' });
      const result = await api.getSupplierPurchases();
      setPurchases(result.data || []);
      await refreshAdminOrders();
      await loadOverviewOnly();
      setNotice('Manual supplier purchase record saved. No supplier API order was submitted.');
    } catch (err) {
      setError(err.message || 'Could not record the supplier purchase.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmPayment(order) {
    setSaving(true);
    setError('');
    try {
      await api.confirmPayment(order.id, paymentForm);
      setPaymentConfirmId(null);
      setPaymentForm({ paymentReference: '', verificationNote: '' });
      await refreshAdminOrders();
      await loadOverviewOnly();
      setNotice('Manual payment confirmation recorded.');
    } catch (err) {
      setError(err.message || 'Could not confirm payment.');
    } finally {
      setSaving(false);
    }
  }

  const draftProducts = adminProducts.filter(product => product.status === 'Draft');
  const pendingPaymentOrders = orders.filter(order => order.paymentStatus === 'pending_verification');
  const visibleOrders = [...orders].sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

  return (
    <div className="ds-page">
      <header className="ds-page-head">
        <div>
          <div className="ds-eyebrow"><Sparkles size={13} /> SHOPPERCART WORKSPACE</div>
          <h1>AI Dropshipping</h1>
          <p>Research, review, price, and publish products from one controlled workspace.</p>
        </div>
        <div className="ds-head-actions">
          <StatusPill tone={connections?.database?.includes('connected') ? 'green' : 'amber'}>{connections?.database || 'Checking data connection'}</StatusPill>
          <button className="ds-refresh" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'ds-spin' : ''} /> Refresh</button>
        </div>
      </header>

      {error && <div className="ds-alert ds-alert-error" role="alert"><AlertTriangle size={16} />{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={14} /></button></div>}
      {notice && <div className="ds-alert ds-alert-success" role="status"><CheckCircle2 size={16} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={14} /></button></div>}

      <div className="ds-layout">
        <nav className="ds-nav" aria-label="Dropshipping sections">
          {NAV.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}><Icon size={16} /><span>{item.label}</span>{section === item.id && <ChevronRight size={14} />}</button>;
          })}
          <div className="ds-nav-note"><ShieldCheck size={16} /><span>Publishing requires review. Supplier execution stays manual until an official adapter is connected.</span></div>
        </nav>

        <main className="ds-content">
          {loading && !overview && <div className="ds-loading"><RefreshCw size={20} className="ds-spin" /> Loading live workspace data…</div>}

          {section === 'overview' && (
            <section className="ds-stack">
              <div className="ds-section-head">
                <div><h2>Store performance</h2><p>Metrics come from the connected catalog and order records. Missing signals stay clearly marked.</p></div>
                <select className="ds-period" value={days} onChange={event => setDays(Number(event.target.value))} aria-label="Report period">
                  <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
                </select>
              </div>
              <div className="ds-metric-grid">
                <MetricCard label="Order value" value={format(metrics.orderValue || 0)} note={`Includes unpaid orders · ${periodChange(metrics.orderValue, previous.orderValue)}`} icon={DollarSign} />
                <MetricCard label="Verified paid revenue" value={confirmedRevenue} note={`${metrics.paidOrders || 0} paid orders · ${periodChange(metrics.paidRevenue, previous.paidRevenue)}`} icon={CheckCircle2} tone="green" />
                <MetricCard label="Units sold" value={metrics.unitsSold == null ? '—' : metrics.unitsSold.toLocaleString()} note={metrics.unitsSold == null ? 'No verified paid order units yet' : 'From paid order records'} icon={Package} tone="violet" />
                <MetricCard label="Supplier spend" value={format(metrics.supplierSpend || 0)} note="Recorded manual supplier purchases" icon={Truck} tone="amber" />
                <MetricCard label="Gross profit" value={metrics.grossProfit == null ? 'Unavailable' : format(metrics.grossProfit)} note={metrics.grossProfit == null ? 'Supplier cost is missing on one or more paid items' : 'Before payment and platform fees'} icon={DollarSign} tone="green" />
                <MetricCard label="Gross margin" value={metrics.grossMargin == null ? 'Unavailable' : `${metrics.grossMargin.toFixed(1)}%`} note="Based on recorded supplier costs; excludes fees, tax, and ads" icon={Activity} tone="green" />
                <MetricCard label="Draft products" value={metrics.drafts || 0} note="Hidden from shoppers until published" icon={Package} tone="violet" />
                <MetricCard label="Low stock" value={metrics.stockAlerts || 0} note="Catalog quantity below 5" icon={AlertTriangle} tone="amber" />
                <MetricCard label="Estimated profit" value="Unavailable" note="Fees, ads, and verified supplier costs are incomplete" icon={Activity} />
              </div>
              <div className="ds-two-col">
                <section className="ds-panel" style={cardStyle}>
                  <div className="ds-panel-head"><div><h3>Order trend</h3><p>Order value is separate from paid revenue.</p></div><StatusPill tone="blue">{days} day window</StatusPill></div>
                  <Chart rows={overview?.chart || []} />
                </section>
                <section className="ds-panel" style={cardStyle}>
                  <div className="ds-panel-head"><div><h3>Operational checks</h3><p>Items requiring a human check.</p></div></div>
                  <div className="ds-check-row"><span><AlertTriangle size={15} /> Pending payment verification</span><strong>{pendingPaymentOrders.length}</strong></div>
                  <div className="ds-check-row"><span><Package size={15} /> Drafts awaiting review</span><strong>{draftProducts.length}</strong></div>
                  <div className="ds-check-row"><span><Truck size={15} /> Supplier purchases recorded</span><strong>{purchases.length}</strong></div>
                  <div className="ds-check-row"><span><Eye size={15} /> Product views / conversion</span><StatusPill>Not tracked</StatusPill></div>
                  <div className="ds-check-row"><span><Activity size={15} /> Demand / competition signals</span><StatusPill>Not connected</StatusPill></div>
                </section>
              </div>
              <section className="ds-panel" style={cardStyle}>
                <div className="ds-panel-head"><div><h3>Recent decisions and actions</h3><p>Audit trail from research, imports, publishing, payment confirmation, and purchase records.</p></div></div>
                {overview?.activity?.length ? <div className="ds-activity-list">{overview.activity.slice(0, 8).map((item, index) => <div key={item._id || index}><span className="ds-activity-dot" /><div><strong>{item.summary}</strong><small>{item.actor || 'Admin'} · {new Date(item.createdAt || Date.now()).toLocaleString()}</small></div></div>)}</div> : <div className="ds-empty">No activity has been recorded yet.</div>}
              </section>
            </section>
          )}

          {section === 'research' && (
            <section className="ds-stack">
              <div className="ds-section-head"><div><h2>Product research</h2><p>Add facts from a supplier or permitted source. Scores describe only the supplied operational inputs.</p></div></div>
              <div className="ds-callout"><AlertTriangle size={17} /><div><strong>Source and uncertainty</strong><span>This repository has no supplier catalog or trend feed. Add a source you are authorized to use. Demand, competition, reliability, seasonality, and policy signals are not inferred.</span></div></div>
              <form className="ds-panel ds-form-panel" style={cardStyle} onSubmit={submitCandidate}>
                <div className="ds-panel-head"><div><h3>Record a sourced opportunity</h3><p>Amounts are converted to the product catalog’s USD base currency on save.</p></div><StatusPill tone="blue">Admin review required</StatusPill></div>
                <div className="ds-form-grid">
                  <Field label="PRODUCT NAME *" name="productName" value={candidateForm.productName} onChange={onCandidateField} required />
                  <label className="ds-field"><span style={labelStyle}>CATEGORY *</span><select name="category" value={candidateForm.category} onChange={onCandidateField} style={inputStyle}><option value="phones">Phones</option><option value="phone-accessories">Phone accessories</option><option value="laptop-accessories">Laptop accessories</option><option value="electrical">Electrical</option></select></label>
                  <Field label="SUPPLIER NAME *" name="supplierName" value={candidateForm.supplierName} onChange={onCandidateField} required />
                  <Field label="SOURCE URL *" name="sourceUrl" value={candidateForm.sourceUrl} onChange={onCandidateField} type="url" placeholder="https://…" required />
                  <Field label="SUPPLIER PRODUCT URL" name="supplierUrl" value={candidateForm.supplierUrl} onChange={onCandidateField} type="url" placeholder="https://…" />
                  <Field label="IMAGE URL" name="imageUrl" value={candidateForm.imageUrl} onChange={onCandidateField} type="url" placeholder="https://…" />
                  <Field label={`SUPPLIER UNIT COST (${currency}) *`} name="unitCost" value={candidateForm.unitCost} onChange={onCandidateField} type="number" min="0" step="0.01" required />
                  <Field label={`SHIPPING COST (${currency})`} name="shippingCost" value={candidateForm.shippingCost} onChange={onCandidateField} type="number" min="0" step="0.01" />
                  <Field label={`PROPOSED RETAIL PRICE (${currency}) *`} name="retailPrice" value={candidateForm.retailPrice} onChange={onCandidateField} type="number" min="0.01" step="0.01" required />
                  <Field label="AVAILABLE STOCK *" name="availableStock" value={candidateForm.availableStock} onChange={onCandidateField} type="number" min="0" step="1" required />
                  <Field label="SHIPPING TIME (DAYS)" name="shippingDays" value={candidateForm.shippingDays} onChange={onCandidateField} type="number" min="0" step="1" placeholder="Unknown" />
                  <Field label="VARIANTS (ONE PER LINE)" name="variants" value={candidateForm.variants} onChange={onCandidateField} placeholder="Black / 64 GB" />
                  <label className="ds-field ds-span-2"><span style={labelStyle}>VERIFIED PRODUCT FACTS (ONE PER LINE)</span><textarea name="verifiedFacts" value={candidateForm.verifiedFacts} onChange={onCandidateField} rows="4" style={{ ...inputStyle, resize: 'vertical' }} placeholder="Only enter details confirmed by the source." /></label>
                </div>
                <div className="ds-form-foot"><span>Research date: {new Date().toLocaleDateString()}</span><button style={buttonStyle} disabled={saving}><Plus size={15} /> Save research</button></div>
              </form>
              {researchMessage && <div className="ds-alert ds-alert-warning" role="status"><AlertTriangle size={16} />{researchMessage}</div>}
              <section className="ds-panel" style={cardStyle}>
                <div className="ds-panel-head"><div><h3>Saved research</h3><p>{research.length} sourced records · no external catalog queries are performed</p></div></div>
                {!research.length ? <div className="ds-empty">No sourced research yet. Add a candidate above to start a review record.</div> : (
                  <div className="ds-research-list">{research.map(candidate => (
                    <article className="ds-research-card" key={candidate._id}>
                      <ProductImageGallery className="ds-research-art" product={{ image: candidate.imageUrl }} alt={candidate.productName} showControls={false} />
                      <div className="ds-research-main">
                        <div className="ds-research-title"><div><h4>{candidate.productName}</h4><small>{candidate.supplierName} · {candidate.category}</small></div><StatusPill tone={candidate.state === 'imported' ? 'green' : 'blue'}>{candidate.state || 'researched'}</StatusPill></div>
                        <p className="ds-research-facts">{candidate.verifiedFacts?.slice(0, 2).join(' · ') || 'No verified product facts supplied.'}</p>
                        <div className="ds-research-data"><span>Cost <b>{format(Number(candidate.unitCost || 0) + Number(candidate.shippingCost || 0))}</b></span><span>Retail <b>{format(candidate.retailPrice || 0)}</b></span><span>Stock <b>{candidate.availableStock ?? '—'}</b></span><span>Ship <b>{candidate.shippingDays != null ? `${candidate.shippingDays} days` : 'Unknown'}</b></span></div>
                        <div className="ds-score-row"><div className="ds-score-track"><i style={{ width: `${candidate.score || 0}%` }} /></div><strong>{candidate.score || 0}<small>/100 operational fit</small></strong><a href={candidate.sourceUrl} target="_blank" rel="noreferrer">Source <ExternalLink size={12} /></a></div>
                        <div className="ds-research-actions">
                          <button style={secondaryStyle} onClick={() => setSelectedCandidate(candidate)}><Eye size={14} /> Preview</button>
                          <button style={secondaryStyle} onClick={() => generateContent(candidate)} disabled={saving || !connections?.ai?.available}><Sparkles size={14} /> Generate copy</button>
                          <button style={buttonStyle} onClick={() => importCandidate(candidate)} disabled={saving}><Package size={14} /> Import as draft</button>
                        </div>
                        {candidate.content?.title && <div className="ds-ai-note"><Sparkles size={13} /> AI copy available; human review required before import or publish.</div>}
                      </div>
                    </article>
                  ))}</div>
                )}
              </section>
            </section>
          )}

          {section === 'pricing' && (
            <section className="ds-stack">
              <div className="ds-section-head"><div><h2>Pricing calculator</h2><p>Calculate in {currency}; imported product values convert to the catalog’s USD base.</p></div></div>
              <div className="ds-two-col ds-pricing-grid">
                <section className="ds-panel" style={cardStyle}>
                  <div className="ds-panel-head"><div><h3>Known costs and target</h3><p>Set fees from your actual processor and platform agreements.</p></div></div>
                  <div className="ds-form-grid ds-one-col-mobile">
                    <Field label={`SUPPLIER UNIT COST (${currency}) *`} name="unitCost" type="number" min="0" step="0.01" value={pricing.unitCost} onChange={onPricingField} />
                    <Field label={`SUPPLIER SHIPPING (${currency}) *`} name="shippingCost" type="number" min="0" step="0.01" value={pricing.shippingCost} onChange={onPricingField} />
                    <Field label="PAYMENT FEE (%) *" name="paymentFee" type="number" min="0" step="0.01" value={pricing.paymentFee} onChange={onPricingField} />
                    <Field label="PLATFORM FEE (%) *" name="platformFee" type="number" min="0" step="0.01" value={pricing.platformFee} onChange={onPricingField} />
                    <Field label={`AD COST PER UNIT (${currency})`} name="advertising" type="number" min="0" step="0.01" value={pricing.advertising} onChange={onPricingField} />
                    <label className="ds-field"><span style={labelStyle}>TARGET TYPE</span><select name="mode" value={pricing.mode} onChange={onPricingField} style={inputStyle}><option value="margin">Gross margin</option><option value="markup">Markup on cost</option></select></label>
                    <Field label={pricing.mode === 'margin' ? 'TARGET GROSS MARGIN (%)' : 'TARGET MARKUP (%)'} name="target" type="number" min="1" max="99" step="1" value={pricing.target} onChange={onPricingField} />
                    <Field label={`ROUND PRICE UP TO (${currency})`} name="rounding" type="number" min="0.01" step="0.01" value={pricing.rounding} onChange={onPricingField} />
                    <Field label={`MINIMUM PROFIT PER UNIT (${currency})`} name="minimumProfit" type="number" min="0" step="0.01" value={pricing.minimumProfit} onChange={onPricingField} />
                  </div>
                  <p className="ds-form-hint">Assumption: input costs share one currency. Tax, refunds, shipping subsidies, and other expenses are excluded unless added as costs.</p>
                </section>
                <section className="ds-panel ds-price-result" style={cardStyle}>
                  <div className="ds-panel-head"><div><h3>Price recommendation</h3><p>{pricing.mode === 'margin' ? 'Target is contribution after listed costs as a share of retail price.' : 'Target is markup over the listed costs.'}</p></div></div>
                  {!pricingResult ? <div className="ds-empty">Enter unit cost, shipping, processor fee, and platform fee to calculate a price.</div> : (
                    <>
                      <div className="ds-price-hero"><small>RECOMMENDED RETAIL</small><strong>{format(toUsd(pricingResult.recommended))}</strong><span>Calculated in {currency}; rounded up to your chosen increment.</span></div>
                      <div className="ds-price-lines"><div><span>Break-even price</span><b>{format(toUsd(pricingResult.breakEven))}</b></div><div><span>Known cost + per-unit ads</span><b>{format(toUsd(pricingResult.baseCost))}</b></div><div><span>Estimated contribution</span><b>{format(toUsd(pricingResult.grossProfit))}</b></div><div><span>Estimated contribution margin</span><b>{pricingResult.grossMargin.toFixed(1)}%</b></div><div><span>Variable fees</span><b>{(pricingResult.fees * 100).toFixed(2)}%</b></div></div>
                      <button style={secondaryStyle} onClick={() => { setCandidateForm(prev => ({ ...prev, unitCost: pricing.unitCost, shippingCost: pricing.shippingCost, retailPrice: String(pricingResult.recommended) })); setSection('research'); }}><Check size={14} /> Use for a sourced candidate</button>
                    </>
                  )}
                </section>
              </div>
            </section>
          )}

          {section === 'studio' && (
            <section className="ds-stack">
              <div className="ds-section-head"><div><h2>Product studio</h2><p>Drafts share the same product catalog as Admin &gt; Products. Only reviewed, in-stock drafts can be published.</p></div><StatusPill tone="amber">Review required</StatusPill></div>
              {!draftProducts.length ? <div className="ds-panel ds-empty" style={cardStyle}>No AI dropshipping drafts yet. Save a research candidate and import it here.</div> : (
                <div className="ds-studio-grid">{draftProducts.map(product => (
                  <button className="ds-studio-card" style={cardStyle} key={product.id} onClick={() => { setEditingDraft({ ...product, price: String(Number(product.price || 0) * (rates[currency] || 1)) }); setDraftChecks({ policyReviewed: false, inventoryVerified: false, contentReviewed: false }); }}>
                    <ProductImageGallery className="ds-studio-image" product={product} alt={product.name} showControls={false} />
                    <div className="ds-studio-body"><div className="ds-studio-row"><StatusPill tone="amber">Draft</StatusPill><span>{product.category}</span></div><h3>{product.name}</h3><p>{product.description || 'Description required before publishing.'}</p><div className="ds-studio-foot"><b>{format(product.price || 0)}</b><span>{product.stock ?? 0} units</span><span>Review draft <ChevronRight size={13} /></span></div></div>
                  </button>
                ))}</div>
              )}
              {editingDraft && (
                <div className="ds-modal-backdrop" role="presentation" onClick={() => setEditingDraft(null)}>
                  <section className="ds-modal" role="dialog" aria-modal="true" aria-label="Review and publish draft" onClick={event => event.stopPropagation()}>
                    <div className="ds-modal-head"><div><h3>Review storefront draft</h3><p>Save edits first. Publishing runs backend completeness checks.</p></div><button className="ds-icon-button" onClick={() => setEditingDraft(null)} aria-label="Close"><X size={17} /></button></div>
                    <div className="ds-form-grid">
                      <Field label="TITLE" value={editingDraft.name || ''} onChange={event => setEditingDraft(prev => ({ ...prev, name: event.target.value }))} />
                      <Field label={`RETAIL PRICE (${currency})`} type="number" min="0.01" step="0.01" value={editingDraft.price || ''} onChange={event => setEditingDraft(prev => ({ ...prev, price: event.target.value }))} />
                      <Field label="STOCK" type="number" min="0" step="1" value={editingDraft.stock ?? ''} onChange={event => setEditingDraft(prev => ({ ...prev, stock: event.target.value }))} />
                      <Field label="IMAGE URL" value={editingDraft.image || ''} onChange={event => setEditingDraft(prev => ({ ...prev, image: event.target.value }))} />
                      <label className="ds-field ds-span-2"><span style={labelStyle}>DESCRIPTION</span><textarea rows="5" style={{ ...inputStyle, resize: 'vertical' }} value={editingDraft.description || ''} onChange={event => setEditingDraft(prev => ({ ...prev, description: event.target.value }))} /></label>
                    </div>
                    <div className="ds-review-checks">
                      <label><input type="checkbox" checked={draftChecks.inventoryVerified} onChange={event => setDraftChecks(prev => ({ ...prev, inventoryVerified: event.target.checked }))} /> I confirmed stock against the supplier source.</label>
                      <label><input type="checkbox" checked={draftChecks.policyReviewed} onChange={event => setDraftChecks(prev => ({ ...prev, policyReviewed: event.target.checked }))} /> I reviewed product claims and policy risks.</label>
                      <label><input type="checkbox" checked={draftChecks.contentReviewed} onChange={event => setDraftChecks(prev => ({ ...prev, contentReviewed: event.target.checked }))} /> I reviewed the final title, image, price, and description.</label>
                    </div>
                    <div className="ds-modal-actions"><button style={secondaryStyle} onClick={saveDraft} disabled={saving}><Save size={14} /> Save draft</button><button style={buttonStyle} onClick={publishDraft} disabled={saving || !draftChecks.inventoryVerified || !draftChecks.policyReviewed || !draftChecks.contentReviewed}><CheckCircle2 size={14} /> Publish to storefront</button></div>
                  </section>
                </div>
              )}
            </section>
          )}

          {section === 'fulfillment' && (
            <section className="ds-stack">
              <div className="ds-section-head"><div><h2>Supplier purchasing &amp; fulfillment</h2><p>Only verified paid orders are eligible. This workspace records manual supplier purchases; it does not submit supplier orders.</p></div><StatusPill tone="amber">No supplier API connected</StatusPill></div>
              <div className="ds-callout"><ShieldCheck size={17} /><div><strong>Purchasing safety</strong><span>Automatic purchasing is off. Checkout callbacks remain pending verification. A super admin must verify payment externally, then you can record a supplier order placed through an authorized supplier channel.</span></div></div>
              <section className="ds-panel" style={cardStyle}>
                <div className="ds-panel-head"><div><h3>Customer orders</h3><p>{visibleOrders.length} orders available to this admin session.</p></div></div>
                {!visibleOrders.length ? <div className="ds-empty">No order records are available.</div> : <div className="ds-order-list">{visibleOrders.map(order => {
                  const status = String(order.status || 'Pending');
                  const cancelled = ['cancelled', 'canceled', 'refunded'].includes(status.toLowerCase());
                  const paid = order.paymentStatus === 'paid';
                  const purchase = purchases.find(item => String(item.orderId) === String(order.id));
                  return (
                    <article className="ds-order-card" key={order.id}>
                      <div className="ds-order-top"><div><h4>{order.id}</h4><p>{order.customer} · {order.email}</p></div><div className="ds-order-badges"><StatusPill tone={paid ? 'green' : 'amber'}>{String(order.paymentStatus || 'unpaid').replaceAll('_', ' ')}</StatusPill><StatusPill>{status}</StatusPill></div></div>
                      <div className="ds-order-meta"><span>Total <b>{format(order.total || 0)}</b></span><span>Items <b>{(order.items || []).reduce((sum, item) => sum + Number(item.qty || 1), 0)}</b></span><span>Supplier spend <b>{purchase ? format(purchase.actualCost || 0) : 'Not recorded'}</b></span></div>
                      {!paid && ['pending_verification', 'unpaid'].includes(order.paymentStatus) && user?.role === 'super_admin' && !cancelled && (
                        paymentConfirmId === order.id ? (
                          <div className="ds-inline-form"><Field label="PAYMENT REFERENCE" value={paymentForm.paymentReference} onChange={event => setPaymentForm(prev => ({ ...prev, paymentReference: event.target.value }))} /><Field label="EXTERNAL VERIFICATION NOTE" value={paymentForm.verificationNote} onChange={event => setPaymentForm(prev => ({ ...prev, verificationNote: event.target.value }))} placeholder="Where/how you verified it" /><button style={buttonStyle} onClick={() => confirmPayment(order)} disabled={saving}>Confirm paid</button><button style={secondaryStyle} onClick={() => setPaymentConfirmId(null)}>Cancel</button></div>
                        ) : <button className="ds-link-button" onClick={() => setPaymentConfirmId(order.id)}>Record external payment verification</button>
                      )}
                      {!paid && <div className="ds-blocked-note"><AlertTriangle size={14} />Supplier purchase blocked until payment is verified as paid.</div>}
                      {paid && !cancelled && !purchase && (purchaseFormId === order.id ? (
                        <div className="ds-inline-form"><Field label="SUPPLIER" value={purchaseForm.supplierName} onChange={event => setPurchaseForm(prev => ({ ...prev, supplierName: event.target.value }))} /><Field label="SUPPLIER ORDER ID" value={purchaseForm.supplierOrderId} onChange={event => setPurchaseForm(prev => ({ ...prev, supplierOrderId: event.target.value }))} /><Field label={`ACTUAL SUPPLIER SPEND (${currency})`} type="number" min="0" step="0.01" value={purchaseForm.actualCost} onChange={event => setPurchaseForm(prev => ({ ...prev, actualCost: event.target.value }))} /><Field label="TRACKING" value={purchaseForm.tracking} onChange={event => setPurchaseForm(prev => ({ ...prev, tracking: event.target.value }))} /><button style={buttonStyle} onClick={() => recordPurchase(order)} disabled={saving}>Save manual record</button><button style={secondaryStyle} onClick={() => setPurchaseFormId(null)}>Cancel</button></div>
                      ) : <button className="ds-link-button" onClick={() => { setPurchaseFormId(order.id); setPurchaseForm({ supplierName: '', supplierOrderId: '', actualCost: '', tracking: '', note: '' }); }}>Record external supplier order</button>)}
                      {purchase && <div className="ds-purchase-note"><CheckCircle2 size={14} /> {purchase.supplierName} · {purchase.supplierOrderId} · recorded manually{purchase.tracking ? ` · tracking ${purchase.tracking}` : ''}</div>}
                    </article>
                  );
                })}</div>}
              </section>
            </section>
          )}

          {section === 'connections' && (
            <section className="ds-stack">
              <div className="ds-section-head"><div><h2>Connections &amp; safeguards</h2><p>Secrets stay on the server. This page reports setup state without asking for private keys.</p></div></div>
              <div className="ds-connection-grid">
                <article className="ds-connection-card" style={cardStyle}>
                  <div className="ds-connection-icon ds-icon-purple"><Sparkles size={19} /></div><div className="ds-connection-title"><div><h3>Free local AI</h3><p>{connections?.ai?.provider || 'Ollama (local)'}</p></div><StatusPill tone={connections?.ai?.available ? 'green' : 'amber'}>{connections?.ai?.available ? 'Ready' : 'Waiting'}</StatusPill></div>
                  <p className="ds-connection-copy">{connections?.ai?.model ? `Model: ${connections.ai.model}.` : 'No local model is configured.'} AI requests are sent only to the server-configured loopback Ollama endpoint. No paid fallback is used.</p>
                  <div className="ds-setup-box"><strong>Server setup</strong><code>Install Ollama, download a local model, then set OLLAMA_MODEL on the backend.</code><span>{connections?.ai?.setup || 'AI output must be checked against verified facts.'}</span></div>
                </article>
                <article className="ds-connection-card" style={cardStyle}>
                  <div className="ds-connection-icon ds-icon-blue"><Truck size={19} /></div><div className="ds-connection-title"><div><h3>Supplier API</h3><p>Official adapters only</p></div><StatusPill tone="amber">Not connected</StatusPill></div>
                  <p className="ds-connection-copy">No supplier provider or credentials are present in these repositories. Stock sync and automatic orders remain off. Manual research and purchase records are available.</p>
                  <div className="ds-setup-box"><strong>Before enabling orders</strong><span>Choose a supplier with an official API, confirm permitted use, implement its adapter, and store credentials as backend environment variables.</span></div>
                </article>
                <article className="ds-connection-card" style={cardStyle}>
                  <div className="ds-connection-icon ds-icon-green"><ShieldCheck size={19} /></div><div className="ds-connection-title"><div><h3>Database &amp; authentication</h3><p>Admin API access is role-gated</p></div><StatusPill tone={connections?.database?.includes('connected') ? 'green' : 'amber'}>{connections?.database?.includes('connected') ? 'Connected' : 'Memory mode'}</StatusPill></div>
                  <p className="ds-connection-copy">JWT sessions and server-side role checks protect research, product changes, and purchasing records. Memory-mode research and purchase data resets when the backend restarts.</p>
                  <div className="ds-setup-box"><strong>Backend environment</strong><code>MONGODB_URI · JWT_SECRET (32+ random characters) · SUPER_ADMIN_EMAIL · SUPER_ADMIN_PASSWORD</code></div>
                </article>
                <article className="ds-connection-card" style={cardStyle}>
                  <div className="ds-connection-icon ds-icon-amber"><DollarSign size={19} /></div><div className="ds-connection-title"><div><h3>Payment verification</h3><p>Paystack callback state</p></div><StatusPill tone="amber">Manual confirmation</StatusPill></div>
                  <p className="ds-connection-copy">The browser callback is stored as pending verification. A super admin must compare the reference with Paystack before the order becomes eligible for supplier purchasing.</p>
                  <div className="ds-setup-box"><strong>Current safeguard</strong><span>No supplier purchase can be recorded against unpaid, unverified, cancelled, or refunded orders.</span></div>
                </article>
              </div>
            </section>
          )}
        </main>
      </div>

      {selectedCandidate && (
        <div className="ds-modal-backdrop" role="presentation" onClick={() => setSelectedCandidate(null)}>
          <section className="ds-modal ds-preview-modal" role="dialog" aria-modal="true" aria-label="Product preview" onClick={event => event.stopPropagation()}>
            <div className="ds-modal-head"><div><h3>Shopper preview</h3><p>This remains a private draft until you publish it.</p></div><button className="ds-icon-button" onClick={() => setSelectedCandidate(null)} aria-label="Close"><X size={17} /></button></div>
            <div className="ds-shopper-preview">
              <ProductImageGallery className="ds-shopper-preview-image" product={{ image: selectedCandidate.imageUrl }} alt={selectedCandidate.productName} showControls={false} />
              <div><StatusPill tone="amber">Preview only</StatusPill><h2>{selectedCandidate.content?.title || selectedCandidate.productName}</h2><p>{selectedCandidate.content?.description || selectedCandidate.verifiedFacts?.join(' ') || 'Add verified product details before publication.'}</p><strong>{format(selectedCandidate.retailPrice || 0)}</strong></div>
            </div>
            {selectedCandidate.content?.bullets?.length > 0 && <ul className="ds-preview-list">{selectedCandidate.content.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}</ul>}
            <div className="ds-preview-source"><ExternalLink size={13} /><a href={selectedCandidate.sourceUrl} target="_blank" rel="noreferrer">Review source facts</a><span>·</span><span>{selectedCandidate.availableStock || 0} supplied stock</span></div>
            <div className="ds-modal-actions"><button style={secondaryStyle} onClick={() => generateContent(selectedCandidate)} disabled={saving || !connections?.ai?.available}><Sparkles size={14} /> Generate with local AI</button><button style={buttonStyle} onClick={() => importCandidate(selectedCandidate)} disabled={saving}><Package size={14} /> Import hidden draft</button></div>
          </section>
        </div>
      )}

      {duplicate && (
        <div className="ds-modal-backdrop" role="presentation" onClick={() => setDuplicate(null)}>
          <section className="ds-modal" role="dialog" aria-modal="true" aria-label="Duplicate product review" onClick={event => event.stopPropagation()}>
            <div className="ds-modal-head"><div><h3>Possible duplicate</h3><p>An existing catalog item matches this research record.</p></div><button className="ds-icon-button" onClick={() => setDuplicate(null)} aria-label="Close"><X size={17} /></button></div>
            <div className="ds-duplicate-row"><Package size={18} /><div><strong>{duplicate.product.name}</strong><span>Current state: {duplicate.product.status || 'Active'} · ID {duplicate.product.id}</span></div></div>
            <p className="ds-form-hint">Updating an existing draft preserves its catalog record. Live products cannot be overwritten by research import; edit them in Admin &gt; Products after reviewing the differences.</p>
            <div className="ds-modal-actions"><button style={secondaryStyle} onClick={() => { setDuplicate(null); setSelectedCandidate(duplicate.candidate); }}>Review candidate</button>{duplicate.product.status === 'Draft' && <button style={buttonStyle} onClick={() => importCandidate(duplicate.candidate, true)} disabled={saving}><RefreshCw size={14} /> Update existing draft</button>}</div>
          </section>
        </div>
      )}
    </div>
  );
}
