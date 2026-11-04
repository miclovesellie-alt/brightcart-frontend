import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, CheckCircle2,
  ChevronRight, DollarSign, ExternalLink, Eye, Package, Plus, RefreshCw,
  Save, Search, ShieldCheck, Sparkles, Truck, X,
} from 'lucide-react';
import { api } from '../../utils/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useStore } from '../../context/StoreContext';
import ProductImageGallery from '../../components/ProductImageGallery';
import { categoryLabel, categorySlug } from '../../utils/productImages';
import './dropshipping.css';

const AI_IMPORT_MARGIN_PERCENT = 35;

function roundMoneyInCurrency(amount, code) {
  const decimals = ['JPY', 'KRW', 'NGN'].includes(code) ? 0 : 2;
  const factor = 10 ** decimals;
  return Math.round(Number(amount) * factor) / factor;
}

const NAV = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'research', label: 'Research', icon: Search },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'studio', label: 'Product studio', icon: Package },
  { id: 'fulfillment', label: 'Fulfillment', icon: Truck },
  { id: 'connections', label: 'Connections', icon: ShieldCheck },
];

const EMPTY_CANDIDATE = {
  productName: '', category: '', sourceUrl: '', supplierName: '', supplierUrl: '',
  imageUrl: '', images: '', unitCost: '', shippingCost: '', shippingStatus: 'unknown', retailPrice: '', currency: '', availableStock: '',
  shippingDays: '', shippingDestination: '', shippingCurrency: '', supplierCurrency: '', verifiedFacts: '', variants: '',
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
  const { currency, rates, format, convertBetween, CURRENCIES } = useCurrency();
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
  const [extractUrl, setExtractUrl] = useState('');
  const [destinationCountry, setDestinationCountry] = useState(user?.country || '');
  const [extracting, setExtracting] = useState(false);
  const [extractionSummary, setExtractionSummary] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [duplicate, setDuplicate] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [draftChecks, setDraftChecks] = useState({ policyReviewed: false, inventoryVerified: false, contentReviewed: false });
  const [purchaseFormId, setPurchaseFormId] = useState(null);
  const [purchaseForm, setPurchaseForm] = useState({ supplierName: '', supplierOrderId: '', actualCost: '', tracking: '', note: '' });
  const [paymentConfirmId, setPaymentConfirmId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ paymentReference: '', verificationNote: '' });
  const [pricing, setPricing] = useState({ unitCost: '', shippingCost: '', paymentFee: '', platformFee: '', advertising: '0', rounding: '1' });
  const [researchMessage, setResearchMessage] = useState('');
  const [researchSearch, setResearchSearch] = useState('');
  const [researchState, setResearchState] = useState('all');
  const [researchSort, setResearchSort] = useState('newest');
  const [studioSearch, setStudioSearch] = useState('');
  const [studioSort, setStudioSort] = useState('name');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('all');
  const [fulfillmentSort, setFulfillmentSort] = useState('newest');

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
  useEffect(() => { if (!destinationCountry && user?.country) setDestinationCountry(user.country); }, [destinationCountry, user?.country]);

  const metrics = overview?.metrics || {};
  const previous = overview?.previous || {};
  const confirmedRevenue = metrics.paidRevenue ? format(metrics.paidRevenue) : format(0);
  const categoryOptions = useMemo(() => {
    const builtIn = ['phones', 'phone-accessories', 'laptop-accessories', 'electrical'];
    const existing = adminProducts.map(product => categorySlug(product.category)).filter(Boolean);
    return [...new Set([...builtIn, ...existing])].sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b)));
  }, [adminProducts]);
  const candidateCurrencyOptions = useMemo(() => {
    const entryCurrency = candidateForm.currency || currency;
    return CURRENCIES.some(item => item.code === entryCurrency)
      ? CURRENCIES
      : [...CURRENCIES, { code: entryCurrency, name: entryCurrency, flag: '🌐' }];
  }, [CURRENCIES, candidateForm.currency, currency]);
  const draftCurrencyOptions = useMemo(() => {
    const entryCurrency = editingDraft?.inputCurrency || currency;
    return CURRENCIES.some(item => item.code === entryCurrency)
      ? CURRENCIES
      : [...CURRENCIES, { code: entryCurrency, name: entryCurrency, flag: '🌐' }];
  }, [CURRENCIES, editingDraft?.inputCurrency, currency]);
  const periodChange = (current, before) => {
    const value = Number(current || 0);
    const prior = Number(before || 0);
    if (prior === 0) return value > 0 ? `New activity vs previous ${days} days` : 'No activity in either period';
    const percentage = ((value - prior) / prior) * 100;
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}% vs previous ${days} days`;
  };
  const toUsd = amount => Number(amount || 0) / (rates[currency] || 1);
  const toUsdIn = (amount, sourceCode = currency) => convertBetween(Number(amount || 0), sourceCode, 'USD');
  const fromSupplierCurrency = (amount, sourceCode, targetCode = currency) => {
    if (amount == null || !sourceCode || !rates[sourceCode] || !rates[targetCode]) return '';
    const converted = convertBetween(Number(amount), sourceCode, targetCode);
    return Number.isFinite(converted) ? String(roundMoneyInCurrency(converted, targetCode)) : '';
  };
  const pricingResult = useMemo(() => {
    const cost = Number(pricing.unitCost);
    const shipping = Number(pricing.shippingCost);
    const payment = Number(pricing.paymentFee);
    const platform = Number(pricing.platformFee);
    const advertising = Number(pricing.advertising);
    const target = AI_IMPORT_MARGIN_PERCENT;
    const rounding = Number(pricing.rounding);
    const fees = (payment + platform) / 100;
    const baseCost = cost + shipping + advertising;
    const inputsReady = [cost, shipping, payment, platform, advertising, rounding].every(Number.isFinite)
      && cost >= 0 && shipping >= 0 && advertising >= 0 && payment >= 0 && platform >= 0 && fees < 1
      && rounding > 0;
    if (!inputsReady || pricing.unitCost === '' || pricing.shippingCost === '' || pricing.paymentFee === '' || pricing.platformFee === '') return null;
    const raw = baseCost / (1 - fees - target / 100);
    if (!Number.isFinite(raw) || raw <= 0) return null;
    const breakEven = baseCost / (1 - fees);
    const recommended = Math.ceil(raw / rounding) * rounding;
    const grossProfit = recommended * (1 - fees) - baseCost;
    const grossMargin = recommended > 0 ? grossProfit / recommended * 100 : 0;
    return { recommended, breakEven, grossProfit, grossMargin, fees, baseCost };
  }, [pricing]);

  const suggestedCandidatePrice = form => {
    const unitCost = Number(form.unitCost);
    if (!Number.isFinite(unitCost) || unitCost <= 0) return '';
    if (form.shippingStatus === 'paid' && form.shippingCost === '') return '';
    const entryCurrency = form.currency || currency;
    const unitCostUsd = toUsdIn(unitCost, entryCurrency);
    const shippingUsd = form.shippingStatus === 'free' ? 0 : form.shippingStatus === 'paid' ? toUsdIn(Number(form.shippingCost), entryCurrency) : 0;
    const policy = connections?.pricing || {};
    const fees = (Number(policy.paymentFeePercent || 0) + Number(policy.platformFeePercent || 0)) / 100;
    const rounding = Number(policy.roundingIncrement || 1);
    const denominator = 1 - fees - AI_IMPORT_MARGIN_PERCENT / 100;
    if (denominator <= 0 || !Number.isFinite(rounding) || rounding <= 0) return '';
    const priceUsd = Math.ceil(((unitCostUsd + shippingUsd) / denominator) / rounding) * rounding;
    const localPrice = convertBetween(priceUsd, 'USD', entryCurrency);
    return Number.isFinite(localPrice) ? String(roundMoneyInCurrency(localPrice, entryCurrency)) : '';
  };

  const onCandidateField = event => {
    const { name, value } = event.target;
    setCandidateForm(prev => {
      const next = {
        ...prev,
        [name]: value,
        ...(name === 'shippingStatus' && value === 'free' ? { shippingCost: '0' } : {}),
        ...(name === 'shippingStatus' && value === 'unknown' ? { shippingCost: '' } : {}),
      };
      if (['unitCost', 'shippingCost', 'shippingStatus'].includes(name)) next.retailPrice = suggestedCandidatePrice(next);
      return next;
    });
  };
  function changeCandidateCurrency(nextCurrency) {
    setCandidateForm(prev => {
      const previousCurrency = prev.currency || currency;
      if (previousCurrency === nextCurrency) return prev;
      const convertField = value => value === '' || value == null
        ? value
        : String(roundMoneyInCurrency(convertBetween(Number(value), previousCurrency, nextCurrency), nextCurrency));
      return {
        ...prev,
        currency: nextCurrency,
        unitCost: convertField(prev.unitCost),
        shippingCost: convertField(prev.shippingCost),
        retailPrice: convertField(prev.retailPrice),
      };
    });
  }
  const onPricingField = event => setPricing(prev => ({ ...prev, [event.target.name]: event.target.value }));

  async function extractSupplierProduct() {
    if (!extractUrl.trim()) {
      setResearchMessage('Enter a supplier product URL first.');
      return;
    }
    setExtracting(true);
    setResearchMessage('');
    setError('');
    setExtractionSummary(null);
    try {
      const result = await api.extractDropshipProduct({ url: extractUrl.trim(), destinationCountry: destinationCountry.trim() });
      const data = result.data || {};
      const supplierCurrency = data.currency || '';
      const shippingCurrency = data.shippingCurrency || supplierCurrency;
      const entryCurrency = supplierCurrency && rates[supplierCurrency] ? supplierCurrency : currency;
      const priceInCurrent = fromSupplierCurrency(data.unitCost, supplierCurrency, entryCurrency);
      const shippingInCurrent = fromSupplierCurrency(data.shippingCost, shippingCurrency, entryCurrency);
      const retailInCurrent = fromSupplierCurrency(data.suggestedRetailPrice, supplierCurrency, entryCurrency);
      const images = Array.isArray(data.images) ? data.images : [];
      const variants = Array.isArray(data.variants) ? data.variants.map(item => `${item.color || item.name}${item.image ? ` | ${item.image}` : ''}`).join('\n') : '';
      setCandidateForm(prev => ({
        ...prev,
        productName: data.productName || prev.productName,
        category: data.category || prev.category,
        sourceUrl: result.source || data.sourceUrl || extractUrl.trim(),
        supplierName: data.supplierName || prev.supplierName,
        supplierUrl: data.supplierUrl || result.source || extractUrl.trim(),
        imageUrl: data.imageUrl || images[0] || '',
        images: images.join('\n'),
        unitCost: priceInCurrent,
        shippingStatus: data.shippingStatus || 'unknown',
        shippingCost: data.shippingStatus === 'free' ? '0' : shippingInCurrent,
        shippingDestination: data.shippingDestination || destinationCountry.trim(),
        shippingCurrency,
        supplierCurrency,
        currency: entryCurrency,
        retailPrice: retailInCurrent,
        availableStock: data.availableStock == null ? '' : String(data.availableStock),
        shippingDays: data.shippingDays == null ? '' : String(data.shippingDays),
        verifiedFacts: (data.verifiedFacts || []).join('\n'),
        variants,
      }));
      setPricing(prev => ({
        ...prev,
        unitCost: fromSupplierCurrency(data.unitCost, supplierCurrency, currency),
        shippingCost: data.shippingStatus === 'free' ? '0' : fromSupplierCurrency(data.shippingCost, shippingCurrency, currency),
      }));
      setExtractionSummary({
        currency: supplierCurrency,
        unitCost: data.unitCost,
        suggestedRetailPrice: data.suggestedRetailPrice,
        shippingStatus: data.shippingStatus || 'unknown',
        missingSignals: data.missingSignals || [],
        pricingPolicy: data.pricingPolicy,
        source: result.source,
      });
      const missing = data.missingSignals?.length ? ` Needs review: ${data.missingSignals.join(', ')}.` : '';
      const conversionWarning = data.unitCost != null && !priceInCurrent ? ` The source price is ${data.unitCost} ${supplierCurrency || '(currency not stated)'}; choose a supported entry currency and enter a verified price.` : '';
      const shippingWarning = data.shippingCost != null && !shippingInCurrent ? ` The supplier shipping fee is ${data.shippingCost} ${shippingCurrency || '(currency not stated)'}; enter a verified fee in the selected currency.` : '';
      setResearchMessage(`Product facts extracted from the source. Check the title, images, variants, and all amounts before saving.${missing}${conversionWarning}${shippingWarning}`);
    } catch (err) {
      setResearchMessage(err.message || 'Could not extract this supplier page. You can still enter verified facts manually.');
    } finally {
      setExtracting(false);
    }
  }

  async function submitCandidate(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const entryCurrency = candidateForm.currency || currency;
      const images = [...new Set(candidateForm.images.split('\n').map(value => value.trim()).filter(Boolean))];
      const variants = candidateForm.variants.split('\n').map(value => value.trim()).filter(Boolean).map(line => {
        const [colorValue, imageValue] = line.split('|').map(value => value.trim());
        const color = colorValue || line;
        return { name: color, color, image: imageValue || '', images: imageValue ? [imageValue] : [] };
      });
      const result = await api.createResearch({
        productName: candidateForm.productName,
        category: categorySlug(candidateForm.category),
        sourceUrl: candidateForm.sourceUrl,
        supplierName: candidateForm.supplierName,
        supplierUrl: candidateForm.supplierUrl,
        imageUrl: candidateForm.imageUrl || images[0] || '',
        images,
        unitCost: candidateForm.unitCost === '' ? null : toUsdIn(candidateForm.unitCost, entryCurrency),
        shippingStatus: candidateForm.shippingStatus,
        shippingCost: candidateForm.shippingStatus === 'free' ? 0 : candidateForm.shippingStatus === 'paid' && candidateForm.shippingCost !== '' ? toUsdIn(candidateForm.shippingCost, entryCurrency) : null,
        shippingDestination: candidateForm.shippingDestination || destinationCountry,
        shippingCurrency: 'USD',
        retailPrice: candidateForm.retailPrice === '' ? null : toUsdIn(candidateForm.retailPrice, entryCurrency),
        availableStock: candidateForm.availableStock === '' ? null : Number(candidateForm.availableStock),
        shippingDays: candidateForm.shippingDays === '' ? null : Number(candidateForm.shippingDays),
        supplierCurrency: candidateForm.supplierCurrency || entryCurrency,
        currency: 'USD',
        verifiedFacts: candidateForm.verifiedFacts.split('\n').map(value => value.trim()).filter(Boolean),
        variants,
      });
      let savedCandidate = result.data;
      let copyMessage = '';
      if (connections?.ai?.available) {
        try {
          const generated = await api.generateProductContent(savedCandidate._id);
          savedCandidate = generated.data;
          copyMessage = ` Draft copy was generated with ${generated.provider || 'the configured AI provider'}.`;
        } catch (copyError) {
          copyMessage = ` AI copy was not generated: ${copyError.message}`;
        }
      }
      let importMessage = '';
      try {
        const imported = await api.importResearch(savedCandidate._id);
        savedCandidate = { ...savedCandidate, state: 'imported', productId: imported.data.id };
        importMessage = ' A hidden catalog draft was also created in Product Studio.';
        try { await refreshAdminProducts(); }
        catch { importMessage += ' Refresh Product Studio if it does not appear immediately.'; }
      } catch (importError) {
        importMessage = ` Research is saved, but the catalog draft could not be created: ${importError.message}`;
      }
      setResearch(prev => [savedCandidate, ...prev]);
      setCandidateForm(EMPTY_CANDIDATE);
      setExtractionSummary(null);
      setNotice(`Research record saved for review.${copyMessage}${importMessage}`);
      setResearchMessage('');
      setSelectedCandidate(savedCandidate);
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
      setNotice(`Draft copy generated with ${result.provider || 'the configured AI provider'}. Review every statement against the supplier source before importing.`);
    } catch (err) {
      setResearchMessage(err.message || 'Configured AI providers are unavailable.');
    } finally {
      setSaving(false);
    }
  }

  async function removeResearch(candidate) {
    const confirmed = window.confirm(`Remove “${candidate.productName}” from saved research? Any imported product draft will remain in the catalog.`);
    if (!confirmed) return;
    setSaving(true);
    setError('');
    try {
      await api.deleteResearch(candidate._id);
      setResearch(prev => prev.filter(item => String(item._id) !== String(candidate._id)));
      if (String(selectedCandidate?._id) === String(candidate._id)) setSelectedCandidate(null);
      setNotice('Research record removed. Imported product drafts are unchanged.');
      await loadOverviewOnly();
    } catch (err) {
      setError(err.message || 'Could not remove this research record.');
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
      setResearch(prev => prev.map(item => String(item._id) === String(candidate._id) ? { ...item, state: 'imported', productId: result.data.id } : item));
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

  function recalculateDraftPrice() {
    const details = editingDraft?.supplierDetails || {};
    const entryCurrency = editingDraft?.inputCurrency || currency;
    const unitCost = Number(details.unitCost);
    const shippingStatus = details.shippingStatus || 'unknown';
    const shippingCost = shippingStatus === 'free' || shippingStatus === 'unknown' ? 0 : Number(details.shippingCost);
    if (!Number.isFinite(unitCost) || unitCost <= 0 || (shippingStatus === 'paid' && (!Number.isFinite(shippingCost) || shippingCost < 0))) {
      setError('Enter a valid supplier cost and confirm the paid shipping amount before calculating the retail price.');
      return;
    }
    const policy = connections?.pricing || {};
    const fees = (Number(policy.paymentFeePercent || 0) + Number(policy.platformFeePercent || 0)) / 100;
    const margin = AI_IMPORT_MARGIN_PERCENT / 100;
    const rounding = Number(policy.roundingIncrement || 1);
    const denominator = 1 - fees - margin;
    if (denominator <= 0 || !Number.isFinite(rounding) || rounding <= 0) {
      setError('The configured price policy cannot produce a positive retail price.');
      return;
    }
    const totalCostUsd = toUsdIn(unitCost, entryCurrency) + (shippingStatus === 'free' || shippingStatus === 'unknown' ? 0 : toUsdIn(shippingCost, entryCurrency));
    const recommendedUsd = Math.ceil((totalCostUsd / denominator) / rounding) * rounding;
    const recommended = convertBetween(recommendedUsd, 'USD', entryCurrency);
    setEditingDraft(prev => ({ ...prev, price: String(roundMoneyInCurrency(recommended, entryCurrency)) }));
    setError('');
    if (shippingStatus === 'unknown') setNotice('Price recalculated at 35% contribution margin using vendor cost only. Confirm shipping and recalculate before publishing.');
    else if (policy.feesConfigured === false) setNotice('Price recalculated with 0% payment/platform fees. Configure actual fees before publishing.');
  }

  function openDraft(product) {
    const entryCurrency = product.supplierDetails?.supplierCurrency || product.inputCurrency || currency;
    const fromUsd = value => value == null || value === '' ? '' : String(roundMoneyInCurrency(convertBetween(Number(value), 'USD', entryCurrency), entryCurrency));
    setEditingDraft({
      ...product,
      inputCurrency: entryCurrency,
      price: fromUsd(product.price || 0),
      supplierDetails: {
        ...(product.supplierDetails || {}),
        unitCost: fromUsd(product.supplierDetails?.unitCost),
        shippingCost: fromUsd(product.supplierDetails?.shippingCost),
      },
    });
    setDraftChecks({ policyReviewed: false, inventoryVerified: false, contentReviewed: false });
  }

  function changeDraftCurrency(nextCurrency) {
    setEditingDraft(prev => {
      if (!prev) return prev;
      const previousCurrency = prev.inputCurrency || currency;
      if (previousCurrency === nextCurrency) return prev;
      const convertField = value => value === '' || value == null
        ? value
        : String(roundMoneyInCurrency(convertBetween(Number(value), previousCurrency, nextCurrency), nextCurrency));
      return {
        ...prev,
        inputCurrency: nextCurrency,
        price: convertField(prev.price),
        supplierDetails: {
          ...(prev.supplierDetails || {}),
          unitCost: convertField(prev.supplierDetails?.unitCost),
          shippingCost: convertField(prev.supplierDetails?.shippingCost),
        },
      };
    });
  }

  function draftPayload() {
    const supplierDetails = editingDraft?.supplierDetails || {};
    const entryCurrency = editingDraft?.inputCurrency || currency;
    return {
      ...editingDraft,
      inputCurrency: entryCurrency,
      price: toUsdIn(editingDraft.price, entryCurrency),
      stock: Number(editingDraft.stock),
      supplierDetails: {
        ...supplierDetails,
        unitCost: supplierDetails.unitCost === '' || supplierDetails.unitCost == null ? null : toUsdIn(supplierDetails.unitCost, entryCurrency),
        shippingCost: supplierDetails.shippingStatus === 'free' ? 0
          : supplierDetails.shippingStatus === 'paid' && supplierDetails.shippingCost !== '' && supplierDetails.shippingCost != null
            ? toUsdIn(supplierDetails.shippingCost, entryCurrency)
            : null,
      },
    };
  }

  async function saveDraft() {
    if (!editingDraft) return;
    setSaving(true);
    setError('');
    try {
      await updateProduct(draftPayload());
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
      await updateProduct(draftPayload());
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
  const visibleResearch = research.filter(candidate => {
    const query = researchSearch.trim().toLowerCase();
    const matchesText = !query || `${candidate.productName || ''} ${candidate.supplierName || ''} ${candidate.category || ''}`.toLowerCase().includes(query);
    const matchesState = researchState === 'all' || (candidate.state || 'researched') === researchState;
    return matchesText && matchesState;
  }).sort((a, b) => {
    if (researchSort === 'name') return String(a.productName || '').localeCompare(String(b.productName || ''));
    if (researchSort === 'cost-asc') return Number(a.unitCost ?? Infinity) - Number(b.unitCost ?? Infinity);
    if (researchSort === 'retail-desc') return Number(b.retailPrice || 0) - Number(a.retailPrice || 0);
    return new Date(b.createdAt || b.researchedAt || 0) - new Date(a.createdAt || a.researchedAt || 0);
  });
  const visibleDraftProducts = draftProducts.filter(product => `${product.name || ''} ${product.category || ''}`.toLowerCase().includes(studioSearch.trim().toLowerCase())).sort((a, b) => {
    if (studioSort === 'price-asc') return Number(a.price || 0) - Number(b.price || 0);
    if (studioSort === 'price-desc') return Number(b.price || 0) - Number(a.price || 0);
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
  const pendingPaymentOrders = orders.filter(order => order.paymentStatus === 'pending_verification');
  const visibleOrders = orders.filter(order => fulfillmentStatus === 'all' || String(order.status || 'Pending') === fulfillmentStatus).sort((a, b) => {
    if (fulfillmentSort === 'oldest') return new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0);
    if (fulfillmentSort === 'total-desc') return Number(b.total || 0) - Number(a.total || 0);
    return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
  });

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
              <div className="ds-section-head"><div><h2>Product research</h2><p>Import a supplier product page, verify its facts and pricing, then save it for admin review.</p></div></div>
              <div className="ds-callout"><AlertTriangle size={17} /><div><strong>Source and uncertainty</strong><span>AI imports target a fixed 35% contribution margin after configured payment and platform fees. Confirmed shipping is included; when freight is unknown, the draft price is based on vendor unit cost only and must be recalculated after shipping is verified.</span></div></div>
              <section className="ds-panel ds-form-panel" style={cardStyle}>
                <div className="ds-panel-head"><div><h3>Import from supplier URL</h3><p>Enter a product page to extract its listed facts, images, vendor price, and structured color options.</p></div><StatusPill tone="blue">Source review required</StatusPill></div>
                <div className="ds-form-grid">
                  <Field label="SUPPLIER PRODUCT URL *" value={extractUrl} onChange={event => setExtractUrl(event.target.value)} type="url" placeholder="https://supplier.com/product/…" />
                  <Field label="SHIPPING DESTINATION (COUNTRY OR ISO CODE)" value={destinationCountry} onChange={event => setDestinationCountry(event.target.value)} placeholder="e.g. GH" help="The importer only accepts a shipping rate explicitly marked for this destination." />
                </div>
                <div className="ds-form-foot"><span>Extraction reads public HTML and product metadata only. Pages that require sign-in or JavaScript may need manual entry.</span><button type="button" style={buttonStyle} disabled={extracting || saving} onClick={extractSupplierProduct}><Search size={15} /> {extracting ? "Reading supplier page…" : "Extract product details"}</button></div>
                {extractionSummary && <div className="ds-ai-note"><Sparkles size={13} />{extractionSummary.unitCost != null ? `Vendor cost: ${extractionSummary.unitCost} ${extractionSummary.currency || "(currency not stated)"}. ` : ""}{extractionSummary.suggestedRetailPrice != null ? `Suggested selling price: ${extractionSummary.suggestedRetailPrice} ${extractionSummary.currency} at a 35% contribution margin${extractionSummary.shippingStatus === 'unknown' ? ', excluding unconfirmed shipping' : ''}.` : "A selling price needs a verified vendor cost."}{extractionSummary.pricingPolicy?.feesConfigured === false ? " Payment/platform fees currently default to 0; configure them before publishing." : ""}</div>}
              </section>
              <form className="ds-panel ds-form-panel" style={cardStyle} onSubmit={submitCandidate}>
                <div className="ds-panel-head"><div><h3>Review extracted facts</h3><p>Confirm missing values before saving. Amounts are stored in the catalog’s USD base currency.</p></div><StatusPill tone="blue">Draft only</StatusPill></div>
                <div className="ds-form-grid">
                  <Field label="PRODUCT NAME *" name="productName" value={candidateForm.productName} onChange={onCandidateField} required />
                  <label className="ds-field"><span style={labelStyle}>CATEGORY *</span><input list="dropship-product-categories" name="category" value={categoryLabel(candidateForm.category)} onChange={onCandidateField} placeholder="Choose or add a category" style={inputStyle} required /><datalist id="dropship-product-categories">{categoryOptions.map(category => <option key={category} value={categoryLabel(category)} />)}</datalist><small>Choose an existing category or type a new one.</small></label>
                  <Field label="SUPPLIER NAME *" name="supplierName" value={candidateForm.supplierName} onChange={onCandidateField} required />
                  <Field label="SOURCE URL *" name="sourceUrl" value={candidateForm.sourceUrl} onChange={onCandidateField} type="url" placeholder="https://…" required />
                  <Field label="SUPPLIER PRODUCT URL" name="supplierUrl" value={candidateForm.supplierUrl} onChange={onCandidateField} type="url" placeholder="https://…" />
                  <Field label="IMAGE URL" name="imageUrl" value={candidateForm.imageUrl} onChange={onCandidateField} type="url" placeholder="https://…" />
                  <label className="ds-field"><span style={labelStyle}>PRICE ENTRY CURRENCY</span><select value={candidateForm.currency || currency} onChange={event => changeCandidateCurrency(event.target.value)} style={inputStyle}>{candidateCurrencyOptions.map(item => <option key={item.code} value={item.code}>{item.flag} {item.code} · {item.name}</option>)}</select><small>Supplier currency is selected from the product page; changing it converts the entered amounts.</small></label>
                  <Field label={`SUPPLIER UNIT COST (${candidateForm.currency || currency})`} name="unitCost" value={candidateForm.unitCost} onChange={onCandidateField} type="number" min="0" step="0.01" placeholder="Unknown" />
                  <label className="ds-field"><span style={labelStyle}>SUPPLIER SHIPPING STATUS *</span><select name="shippingStatus" value={candidateForm.shippingStatus} onChange={onCandidateField} style={inputStyle}><option value="unknown">Unknown / not shown</option><option value="free">Free shipping confirmed</option><option value="paid">Paid shipping confirmed</option></select></label>
                  <Field label={`SHIPPING COST (${candidateForm.currency || currency})`} name="shippingCost" value={candidateForm.shippingCost} onChange={onCandidateField} type="number" min="0" step="0.01" placeholder={candidateForm.shippingStatus === 'unknown' ? 'Unknown' : candidateForm.shippingStatus === 'free' ? '0' : 'Required when paid'} required={candidateForm.shippingStatus === 'paid'} />
                  <Field label={`35% TARGET SELLING PRICE (${candidateForm.currency || currency})`} name="retailPrice" value={candidateForm.retailPrice} type="number" min="0.01" step="0.01" placeholder="Calculated from vendor cost" readOnly help="Calculated from vendor cost, confirmed shipping when available, and configured fees. Unknown shipping is excluded until verified." />
                  <Field label="AVAILABLE STOCK" name="availableStock" value={candidateForm.availableStock} onChange={onCandidateField} type="number" min="0" step="1" placeholder="Unknown" />
                  <Field label="SHIPPING TIME (DAYS)" name="shippingDays" value={candidateForm.shippingDays} onChange={onCandidateField} type="number" min="0" step="1" placeholder="Unknown" />
                  <Field label="COLOR VARIANTS (COLOR | IMAGE URL)" name="variants" value={candidateForm.variants} onChange={onCandidateField} placeholder="Black | https://… (one per line)" />
                  <label className="ds-field ds-span-2"><span style={labelStyle}>PRODUCT IMAGES (ONE URL PER LINE)</span><textarea name="images" value={candidateForm.images} onChange={onCandidateField} rows="3" style={{ ...inputStyle, resize: 'vertical' }} placeholder="https://supplier.com/image.jpg" /></label>
                  <label className="ds-field ds-span-2"><span style={labelStyle}>VERIFIED PRODUCT FACTS (ONE PER LINE)</span><textarea name="verifiedFacts" value={candidateForm.verifiedFacts} onChange={onCandidateField} rows="4" style={{ ...inputStyle, resize: 'vertical' }} placeholder="Only enter details confirmed by the source." /></label>
                </div>
                <div className="ds-form-foot"><span>All AI imported drafts use a fixed 35% contribution margin after configured fees. Unknown freight is excluded and flagged.</span><button style={buttonStyle} disabled={saving}><Plus size={15} /> Save for draft review</button></div>
              </form>
              {researchMessage && <div className="ds-alert ds-alert-warning" role="status"><AlertTriangle size={16} />{researchMessage}</div>}
              <section className="ds-panel" style={cardStyle}>
                <div className="ds-panel-head"><div><h3>Saved research</h3><p>{research.length} sourced records · no external catalog queries are performed</p></div></div>
                {!research.length ? <div className="ds-empty">No sourced research yet. Add a candidate above to start a review record.</div> : (
                  <>
                  <div className="ds-list-controls">
                    <input aria-label="Search saved research" value={researchSearch} onChange={event => setResearchSearch(event.target.value)} placeholder="Search products, suppliers, categories…" style={inputStyle} />
                    <select aria-label="Filter research by state" value={researchState} onChange={event => setResearchState(event.target.value)} style={inputStyle}><option value="all">All research states</option><option value="researched">Research only</option><option value="imported">Imported drafts</option></select>
                    <select aria-label="Sort saved research" value={researchSort} onChange={event => setResearchSort(event.target.value)} style={inputStyle}><option value="newest">Newest first</option><option value="name">Name A–Z</option><option value="cost-asc">Vendor cost: low to high</option><option value="retail-desc">Selling price: high to low</option></select>
                  </div>
                  {!visibleResearch.length ? <div className="ds-empty">No research records match these filters.</div> : <div className="ds-research-list">{visibleResearch.map(candidate => (
                    <article className="ds-research-card" key={candidate._id}>
                      <ProductImageGallery className="ds-research-art" product={{ image: candidate.imageUrl, images: candidate.images }} alt={candidate.productName} showControls={false} />
                      <div className="ds-research-main">
                        <div className="ds-research-title"><div><h4>{candidate.productName}</h4><small>{candidate.supplierName} · {categoryLabel(candidate.category)}</small></div><div className="ds-research-card-actions"><StatusPill tone={candidate.state === 'imported' ? 'green' : 'blue'}>{candidate.state || 'researched'}</StatusPill><button type="button" className="ds-icon-button ds-research-close" onClick={() => removeResearch(candidate)} disabled={saving} aria-label={`Remove ${candidate.productName} from research`} title="Remove from research"><X size={15} /></button></div></div>
                        <p className="ds-research-facts">{candidate.verifiedFacts?.slice(0, 2).join(' · ') || 'No verified product facts supplied.'}</p>
                        <div className="ds-research-data"><span>Vendor cost <b>{candidate.unitCost == null ? 'Unknown' : format(candidate.unitCost)}</b></span><span>35% selling price <b>{candidate.retailPrice == null ? 'Pending' : format(candidate.retailPrice)}</b></span><span>Stock <b>{candidate.availableStock ?? 'Unknown'}</b></span><span>Ship <b>{candidate.shippingStatus === 'free' ? 'Free' : candidate.shippingStatus === 'paid' ? format(candidate.shippingCost || 0) : 'Unknown'}</b></span></div>
                        <div className="ds-score-row"><div className="ds-score-track"><i style={{ width: `${candidate.score || 0}%` }} /></div><strong>{candidate.score || 0}<small>/100 operational fit</small></strong><a href={candidate.sourceUrl} target="_blank" rel="noreferrer">Source <ExternalLink size={12} /></a></div>
                        <div className="ds-research-actions">
                          <button style={secondaryStyle} onClick={() => setSelectedCandidate(candidate)}><Eye size={14} /> Preview</button>
                          <button style={secondaryStyle} onClick={() => generateContent(candidate)} disabled={saving || !connections?.ai?.available}><Sparkles size={14} /> Generate copy</button>
                          {candidate.state === 'imported'
                            ? <button style={buttonStyle} onClick={() => setSection('studio')}><Package size={14} /> View draft in Studio</button>
                            : <button style={buttonStyle} onClick={() => importCandidate(candidate)} disabled={saving}><Package size={14} /> Import as draft</button>}
                        </div>
                        {candidate.content?.title && <div className="ds-ai-note"><Sparkles size={13} /> AI copy available; human review required before import or publish.</div>}
                      </div>
                    </article>
                  ))}</div>}
                  </>
                )}
              </section>
            </section>
          )}

          {section === 'pricing' && (
            <section className="ds-stack">
              <div className="ds-section-head"><div><h2>Pricing calculator</h2><p>Calculate in {currency}; all AI imported items use a fixed 35% contribution margin after configured fees.</p></div></div>
              <div className="ds-two-col ds-pricing-grid">
                <section className="ds-panel" style={cardStyle}>
                  <div className="ds-panel-head"><div><h3>Known costs and fixed target</h3><p>Set fees from your actual processor and platform agreements.</p></div></div>
                  <div className="ds-form-grid ds-one-col-mobile">
                    <Field label={`SUPPLIER UNIT COST (${currency}) *`} name="unitCost" type="number" min="0" step="0.01" value={pricing.unitCost} onChange={onPricingField} />
                    <Field label={`SUPPLIER SHIPPING (${currency}) *`} name="shippingCost" type="number" min="0" step="0.01" value={pricing.shippingCost} onChange={onPricingField} />
                    <Field label="PAYMENT FEE (%) *" name="paymentFee" type="number" min="0" step="0.01" value={pricing.paymentFee} onChange={onPricingField} />
                    <Field label="PLATFORM FEE (%) *" name="platformFee" type="number" min="0" step="0.01" value={pricing.platformFee} onChange={onPricingField} />
                    <Field label={`AD COST PER UNIT (${currency})`} name="advertising" type="number" min="0" step="0.01" value={pricing.advertising} onChange={onPricingField} />
                    <div className="ds-field"><span style={labelStyle}>FIXED AI CONTRIBUTION MARGIN</span><strong style={{ color: '#0f172a', fontSize: 18 }}>35%</strong><small>Applied to every AI imported item after configured fees.</small></div>
                    <Field label={`ROUND PRICE UP TO (${currency})`} name="rounding" type="number" min="0.01" step="0.01" value={pricing.rounding} onChange={onPricingField} />
                  </div>
                  <p className="ds-form-hint">Assumption: input costs share one currency. Tax, refunds, shipping subsidies, and other expenses are excluded unless added as costs. Set the real processor and platform fees in the backend pricing policy before publishing.</p>
                </section>
                <section className="ds-panel ds-price-result" style={cardStyle}>
                  <div className="ds-panel-head"><div><h3>Price recommendation</h3><p>Target is a 35% contribution after listed costs and configured fees.</p></div></div>
                  {!pricingResult ? <div className="ds-empty">Enter unit cost, shipping, processor fee, and platform fee to calculate a price.</div> : (
                    <>
                      <div className="ds-price-hero"><small>RECOMMENDED SELLING PRICE</small><strong>{format(toUsd(pricingResult.recommended))}</strong><span>Calculated in {currency} for a 35% margin; rounded up to your chosen increment.</span></div>
                      <div className="ds-price-lines"><div><span>Break-even price</span><b>{format(toUsd(pricingResult.breakEven))}</b></div><div><span>Known cost + per-unit ads</span><b>{format(toUsd(pricingResult.baseCost))}</b></div><div><span>Estimated contribution</span><b>{format(toUsd(pricingResult.grossProfit))}</b></div><div><span>Estimated contribution margin</span><b>{pricingResult.grossMargin.toFixed(1)}%</b></div><div><span>Variable fees</span><b>{(pricingResult.fees * 100).toFixed(2)}%</b></div></div>
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
                <>
                <div className="ds-list-controls">
                  <input aria-label="Search product drafts" value={studioSearch} onChange={event => setStudioSearch(event.target.value)} placeholder="Search drafts by product or category…" style={inputStyle} />
                  <select aria-label="Sort product drafts" value={studioSort} onChange={event => setStudioSort(event.target.value)} style={inputStyle}><option value="name">Name A–Z</option><option value="price-asc">Selling price: low to high</option><option value="price-desc">Selling price: high to low</option></select>
                </div>
                {!visibleDraftProducts.length ? <div className="ds-panel ds-empty" style={cardStyle}>No product drafts match your search.</div> : <div className="ds-studio-grid">{visibleDraftProducts.map(product => (
                  <button className="ds-studio-card" style={cardStyle} key={product.id} onClick={() => openDraft(product)}>
                    <ProductImageGallery className="ds-studio-image" product={product} alt={product.name} showControls={false} />
                    <div className="ds-studio-body"><div className="ds-studio-row"><StatusPill tone="amber">Draft</StatusPill><span>{categoryLabel(product.category)}</span></div><h3>{product.name}</h3><p>{product.description || 'Description required before publishing.'}</p><div className="ds-studio-foot"><b>{format(product.price || 0)}</b><span>{product.stock ?? 0} units</span><span>Review draft <ChevronRight size={13} /></span></div></div>
                  </button>
                ))}</div>}
                </>
              )}
              {editingDraft && (
                <div className="ds-modal-backdrop" role="presentation" onClick={() => setEditingDraft(null)}>
                  <section className="ds-modal" role="dialog" aria-modal="true" aria-label="Review and publish draft" onClick={event => event.stopPropagation()}>
                    <div className="ds-modal-head"><div><h3>Review storefront draft</h3><p>Save edits first. Publishing runs backend completeness checks.</p></div><button className="ds-icon-button" onClick={() => setEditingDraft(null)} aria-label="Close"><X size={17} /></button></div>
                    <div className="ds-form-grid">
                      <Field label="TITLE" value={editingDraft.name || ''} onChange={event => setEditingDraft(prev => ({ ...prev, name: event.target.value }))} />
                      <label className="ds-field"><span style={labelStyle}>PRICE ENTRY CURRENCY</span><select value={editingDraft.inputCurrency || currency} onChange={event => changeDraftCurrency(event.target.value)} style={inputStyle}>{draftCurrencyOptions.map(item => <option key={item.code} value={item.code}>{item.flag} {item.code} · {item.name}</option>)}</select><small>Changing this converts the displayed prices while keeping their USD catalog values unchanged.</small></label>
                      <Field label={`RETAIL PRICE (${editingDraft.inputCurrency || currency})`} type="number" min="0.01" step="0.01" value={editingDraft.price || ''} onChange={event => setEditingDraft(prev => ({ ...prev, price: event.target.value }))} />
                      <Field label="STOCK" type="number" min="0" step="1" value={editingDraft.stock ?? ''} onChange={event => setEditingDraft(prev => ({ ...prev, stock: event.target.value }))} />
                      <label className="ds-field"><span style={labelStyle}>SUPPLIER SHIPPING STATUS *</span><select value={editingDraft.supplierDetails?.shippingStatus || 'unknown'} onChange={event => setEditingDraft(prev => ({ ...prev, price: '', supplierDetails: { ...(prev.supplierDetails || {}), shippingStatus: event.target.value, shippingCost: event.target.value === 'free' ? '0' : event.target.value === 'unknown' ? '' : prev.supplierDetails?.shippingCost || '' } }))} style={inputStyle}><option value="unknown">Unknown / not verified</option><option value="free">Free shipping confirmed</option><option value="paid">Paid shipping confirmed</option></select></label>
                      <Field label={'SUPPLIER UNIT COST (' + (editingDraft.inputCurrency || currency) + ')'} type="number" min="0" step="0.01" value={editingDraft.supplierDetails?.unitCost ?? ''} onChange={event => setEditingDraft(prev => ({ ...prev, price: '', supplierDetails: { ...(prev.supplierDetails || {}), unitCost: event.target.value } }))} placeholder="Unknown" />
                      <Field label={'SUPPLIER SHIPPING COST (' + (editingDraft.inputCurrency || currency) + ')'} type="number" min="0" step="0.01" value={editingDraft.supplierDetails?.shippingCost ?? ''} onChange={event => setEditingDraft(prev => ({ ...prev, price: '', supplierDetails: { ...(prev.supplierDetails || {}), shippingCost: event.target.value } }))} placeholder={editingDraft.supplierDetails?.shippingStatus === 'unknown' ? 'Unknown' : editingDraft.supplierDetails?.shippingStatus === 'free' ? '0' : 'Required when paid'} required={editingDraft.supplierDetails?.shippingStatus === 'paid'} disabled={editingDraft.supplierDetails?.shippingStatus !== 'paid'} />
                      <Field label="SHIPPING DESTINATION" value={editingDraft.supplierDetails?.shippingDestination || ''} onChange={event => setEditingDraft(prev => ({ ...prev, supplierDetails: { ...(prev.supplierDetails || {}), shippingDestination: event.target.value } }))} placeholder="Country or ISO code" />
                      <Field label="IMAGE URL" value={editingDraft.image || ''} onChange={event => setEditingDraft(prev => ({ ...prev, image: event.target.value }))} />
                      <label className="ds-field ds-span-2"><span style={labelStyle}>DESCRIPTION</span><textarea rows="5" style={{ ...inputStyle, resize: 'vertical' }} value={editingDraft.description || ''} onChange={event => setEditingDraft(prev => ({ ...prev, description: event.target.value }))} /></label>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '12px 0 4px' }}><button type="button" style={secondaryStyle} onClick={recalculateDraftPrice}>Recalculate retail price from confirmed costs</button></div>
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
                <div className="ds-panel-head"><div><h3>Customer orders</h3><p>{visibleOrders.length} orders available for this view.</p></div></div>
                <div className="ds-list-controls">
                  <select aria-label="Filter fulfillment orders by status" value={fulfillmentStatus} onChange={event => setFulfillmentStatus(event.target.value)} style={inputStyle}><option value="all">All order statuses</option>{['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Canceled', 'Refunded'].map(status => <option key={status} value={status}>{status}</option>)}</select>
                  <select aria-label="Sort fulfillment orders" value={fulfillmentSort} onChange={event => setFulfillmentSort(event.target.value)} style={inputStyle}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="total-desc">Order total: high to low</option></select>
                </div>
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
                  <div className="ds-connection-icon ds-icon-purple"><Sparkles size={19} /></div><div className="ds-connection-title"><div><h3>AI provider fallback</h3><p>{connections?.ai?.provider || 'Gemini → Groq → Ollama'}</p></div><StatusPill tone={connections?.ai?.available ? 'green' : 'amber'}>{connections?.ai?.available ? 'Configured' : 'Not configured'}</StatusPill></div>
                  <p className="ds-connection-copy">Configured providers are tried in order. Quota, network, or model errors trigger the next configured provider. Use free-tier accounts if you want to avoid provider charges; credentials remain on the server.</p>
                  <div className="ds-setup-box"><strong>Optional backend setup</strong><code>GEMINI_API_KEY · GROQ_API_KEY · OLLAMA_MODEL</code><span>{connections?.ai?.setup || 'AI output must be checked against verified facts.'}</span></div>
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
            <div className="ds-modal-head"><div><h3>Shopper preview</h3><p>{selectedCandidate.state === 'imported' ? 'A private product draft is ready in Product Studio.' : 'This remains a private draft until you publish it.'}</p></div><button className="ds-icon-button" onClick={() => setSelectedCandidate(null)} aria-label="Close"><X size={17} /></button></div>
            <div className="ds-shopper-preview">
              <ProductImageGallery className="ds-shopper-preview-image" product={{ image: selectedCandidate.imageUrl }} alt={selectedCandidate.productName} showControls={false} />
              <div><StatusPill tone="amber">Preview only</StatusPill><h2>{selectedCandidate.content?.title || selectedCandidate.productName}</h2><p>{selectedCandidate.content?.description || selectedCandidate.verifiedFacts?.join(' ') || 'Add verified product details before publication.'}</p><strong>{format(selectedCandidate.retailPrice || 0)}</strong></div>
            </div>
            {selectedCandidate.content?.bullets?.length > 0 && <ul className="ds-preview-list">{selectedCandidate.content.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}</ul>}
            <div className="ds-preview-source"><ExternalLink size={13} /><a href={selectedCandidate.sourceUrl} target="_blank" rel="noreferrer">Review source facts</a><span>·</span><span>{selectedCandidate.availableStock || 0} supplied stock</span></div>
            <div className="ds-modal-actions"><button style={secondaryStyle} onClick={() => generateContent(selectedCandidate)} disabled={saving || !connections?.ai?.available}><Sparkles size={14} /> Generate copy with configured AI</button>{selectedCandidate.state === 'imported' ? <button style={buttonStyle} onClick={() => { setSelectedCandidate(null); setSection('studio'); }}><Package size={14} /> Review in Product Studio</button> : <button style={buttonStyle} onClick={() => importCandidate(selectedCandidate)} disabled={saving}><Package size={14} /> Import hidden draft</button>}</div>
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

