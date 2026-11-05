import { useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useCurrency } from '../../context/CurrencyContext';
import { isSampleProduct } from '../../utils/catalog';
import { categoryLabel, categorySlug, getProductImages } from '../../utils/productImages';
import ProductImageGallery from '../../components/ProductImageGallery';
import { Search, Plus, Edit2, Trash2, X, ImagePlus, Download } from 'lucide-react';
import { downloadCsv } from '../../utils/csv';

const CATEGORIES = [
  { label: 'Phones', slug: 'phones' },
  { label: 'Phone Accessories', slug: 'phone-accessories' },
  { label: 'Laptop Accessories', slug: 'laptop-accessories' },
  { label: 'Electrical', slug: 'electrical' },
];

const STATUS_OPTIONS = ['Active', 'Draft', 'Out of Stock'];
const EMPTY_FORM = {
  name: '', category: 'phones', currency: 'USD', price: '', originalPrice: '', cost: '', shippingCost: '0',
  stock: '', description: '', supplier: '', status: 'Active', sku: '', tag: '', featured: false, images: [''],
};

function unitCost(product) {
  return Number(product.supplierDetails?.unitCost ?? product.cost ?? 0);
}

function shippingCost(product) {
  return Number(product.supplierDetails?.shippingCost ?? 0);
}

function hasRecordedCost(product) {
  return product.supplierDetails?.unitCost !== undefined || product.cost !== undefined;
}

function productProfit(product) {
  if (!hasRecordedCost(product)) return null;
  return Number(product.price || 0) - unitCost(product) - shippingCost(product);
}

function isValidImageUrl(value) {
  if (!value) return true;
  if (value.startsWith('/')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function amountForInput(usdAmount, currency, convert) {
  if (usdAmount === undefined || usdAmount === null || usdAmount === '') return '';
  return roundCurrencyAmount(convert(Number(usdAmount), currency), currency);
}

function roundCurrencyAmount(amount, currency) {
  const decimals = ['JPY', 'KRW', 'NGN'].includes(currency) ? 0 : 2;
  return Number(amount).toFixed(decimals);
}

export default function AdminProducts() {
  const { adminProducts: products, addProduct, updateProduct, deleteProduct, pageParams } = useStore();
  const { format, currency: preferredCurrency, convert, convertBetween, CURRENCIES } = useCurrency();
  const [search, setSearch] = useState(() => pageParams?.search || '');
  const [cat, setCat] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState(() => pageParams?.stock || 'all');
  const [sortBy, setSortBy] = useState('name');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const realProducts = products.filter(product => !isSampleProduct(product));
  const categories = useMemo(() => {
    const values = [...CATEGORIES.map(item => item.slug), ...realProducts.map(product => product.category).filter(Boolean)];
    return [...new Set(values)].map(slug => ({ slug, label: categoryLabel(slug) }));
  }, [realProducts]);
  const filtered = realProducts.filter(product => {
    const matchCat = cat === 'All' || product.category === cat;
    const matchStatus = statusFilter === 'All' || (product.status || 'Active') === statusFilter;
    const matchStock = stockFilter !== 'low' || Number(product.stock ?? 0) < 5;
    const matchQ = `${product.name || ''} ${product.sku || ''} ${String(product.category || '').replace(/[-_]/g, ' ')}`.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchStatus && matchStock && matchQ;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return Number(a.price || 0) - Number(b.price || 0);
    if (sortBy === 'price-desc') return Number(b.price || 0) - Number(a.price || 0);
    if (sortBy === 'stock-asc') return Number(a.stock || 0) - Number(b.stock || 0);
    if (sortBy === 'stock-desc') return Number(b.stock || 0) - Number(a.stock || 0);
    return a.name.localeCompare(b.name);
  });

  const openNew = () => { setForm({ ...EMPTY_FORM, currency: preferredCurrency, images: [''] }); setEditProduct(null); setFormError(''); setShowModal(true); };
  const openEdit = product => {
    const images = getProductImages(product);
    const entryCurrency = product.inputCurrency || 'USD';
    setForm({
      ...EMPTY_FORM,
      ...product,
      currency: entryCurrency,
      category: product.category || 'phones',
      price: amountForInput(product.price, entryCurrency, convert),
      originalPrice: amountForInput(product.originalPrice, entryCurrency, convert),
      cost: amountForInput(product.supplierDetails?.unitCost ?? product.cost, entryCurrency, convert),
      shippingCost: amountForInput(product.supplierDetails?.shippingCost ?? 0, entryCurrency, convert),
      stock: String(product.stock ?? 0),
      sku: product.sku || '',
      tag: product.tag || '',
      featured: Boolean(product.featured),
      images: images.length ? images : [''],
    });
    setEditProduct(product);
    setFormError('');
    setShowModal(true);
  };
  const closeModal = () => { if (!saving) { setShowModal(false); setEditProduct(null); setFormError(''); } };

  const F = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const changeInputCurrency = nextCurrency => setForm(current => {
    if (current.currency === nextCurrency) return current;
    const moneyFields = ['price', 'originalPrice', 'cost', 'shippingCost'];
    const convertedFields = Object.fromEntries(moneyFields.map(field => [
      field,
      current[field] === '' ? '' : roundCurrencyAmount(convertBetween(Number(current[field]), current.currency, nextCurrency), nextCurrency),
    ]));
    return { ...current, ...convertedFields, currency: nextCurrency };
  });
  const updateImage = (index, value) => setForm(current => ({
    ...current,
    images: current.images.map((image, imageIndex) => imageIndex === index ? value : image),
  }));
  const removeImage = index => setForm(current => ({
    ...current,
    images: current.images.length === 1 ? [''] : current.images.filter((_, imageIndex) => imageIndex !== index),
  }));

  const handleSave = async () => {
    const name = form.name.trim();
    const category = categorySlug(form.category);
    const enteredPrice = Number(form.price);
    const enteredCost = Number(form.cost);
    const enteredShipping = Number(form.shippingCost || 0);
    const enteredCompareAt = form.originalPrice === '' ? null : Number(form.originalPrice);
    const price = convertBetween(enteredPrice, form.currency, 'USD');
    const cost = convertBetween(enteredCost, form.currency, 'USD');
    const shipping = convertBetween(enteredShipping, form.currency, 'USD');
    const stock = Number(form.stock || 0);
    const images = [...new Set(form.images.map(value => value.trim()).filter(Boolean))];

    if (!name || !category || !Number.isFinite(enteredPrice) || enteredPrice <= 0 || !Number.isFinite(price) || price <= 0) {
      setFormError('Add a product name, category, and selling price greater than zero.');
      return;
    }
    if (form.cost === '' || !Number.isFinite(enteredCost) || enteredCost < 0 || !Number.isFinite(enteredShipping) || enteredShipping < 0 || !Number.isFinite(cost) || !Number.isFinite(shipping)) {
      setFormError('Enter a valid supplier unit cost and shipping cost so profit can be calculated.');
      return;
    }
    if (enteredCompareAt !== null && (!Number.isFinite(enteredCompareAt) || enteredCompareAt < 0)) {
      setFormError('Compare-at price must be zero or more.');
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setFormError('Stock must be zero or more.');
      return;
    }
    if (images.some(image => !isValidImageUrl(image))) {
      setFormError('Use a complete http(s) image URL or a site path beginning with /.');
      return;
    }

    const supplierDetails = {
      ...(editProduct?.supplierDetails || {}),
      unitCost: cost,
      shippingCost: shipping,
    };
    const productFields = Object.fromEntries(Object.entries(form).filter(([key]) => key !== 'currency'));
    const data = {
      ...productFields,
      name,
      category,
      price,
      originalPrice: enteredCompareAt === null ? price : convertBetween(enteredCompareAt, form.currency, 'USD'),
      cost,
      inputCurrency: form.currency,
      supplierDetails,
      stock: Math.floor(stock),
      images,
      image: images[0] || '',
      sku: form.sku.trim() || `${category.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      tag: form.tag.trim(),
      featured: Boolean(form.featured),
      status: form.status,
    };

    setSaving(true);
    setFormError('');
    try {
      if (editProduct) await updateProduct({ ...editProduct, ...data });
      else await addProduct(data);
      setShowModal(false);
      setEditProduct(null);
    } catch (error) {
      setFormError(error.message || 'Could not save this product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const margin = product => product.price > 0 && productProfit(product) !== null ? Math.round(productProfit(product) / Number(product.price) * 100) : null;
  const previewPrice = Number(form.price);
  const previewLandedCost = Number(form.cost || 0) + Number(form.shippingCost || 0);
  const previewProfit = previewPrice - previewLandedCost;
  const previewStock = Math.max(0, Number(form.stock) || 0);
  const previewReady = form.price !== '' && previewPrice > 0 && form.cost !== '' && Number.isFinite(previewLandedCost);
  const formatInputMoney = amount => format(convertBetween(amount, form.currency, 'USD'), form.currency);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', margin: 0 }}>Products</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>{realProducts.length} products &mdash; {filtered.length} shown</p>
        </div>
        <button onClick={() => downloadCsv('shoppercart-products.csv', filtered.map(product => ({
          name: product.name, sku: product.sku, category: categoryLabel(product.category),
          price: product.price, currency: product.inputCurrency || 'USD', comparePrice: product.originalPrice,
          stock: product.stock, status: product.status || 'Active', featured: Boolean(product.featured),
        })))} disabled={!filtered.length} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', background: 'rgba(255,255,255,.05)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,.1)', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: filtered.length ? 'pointer' : 'not-allowed', opacity: filtered.length ? 1 : .5 }}>
          <Download size={14} /> Export CSV
        </button>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search products..." style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select aria-label="Filter products by category" value={cat} onChange={event => setCat(event.target.value)} style={{ ...inp, width: 'auto', minWidth: 155, padding: '8px 10px', fontSize: 12, cursor: 'pointer' }}>
          <option value="All">All categories</option>
          {categories.map(({ label, slug }) => <option key={slug} value={slug}>{label}</option>)}
        </select>
        <select aria-label="Filter products by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} style={{ ...inp, width: 'auto', minWidth: 135, padding: '8px 10px', fontSize: 12, cursor: 'pointer' }}>
          <option value="All">All statuses</option>
          {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        <select aria-label="Filter products by stock level" value={stockFilter} onChange={event => setStockFilter(event.target.value)} style={{ ...inp, width: 'auto', minWidth: 130, padding: '8px 10px', fontSize: 12, cursor: 'pointer' }}>
          <option value="all">All stock levels</option><option value="low">Low stock (&lt; 5)</option>
        </select>
        <select aria-label="Sort products" value={sortBy} onChange={event => setSortBy(event.target.value)} style={{ ...inp, width: 'auto', minWidth: 150, padding: '8px 10px', fontSize: 12, cursor: 'pointer' }}>
          <option value="name">Name A–Z</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="stock-asc">Stock: low to high</option><option value="stock-desc">Stock: high to low</option>
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', overflow: 'hidden' }}>
        <div className="admin-mobile-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="admin-mobile-table" style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', minWidth: 780 }}>
            <thead><tr style={{ background: '#f8fafc' }}>
              {['Product', 'Category', 'Price', 'Landed cost', 'Profit / unit', 'Margin', 'Stock', 'Supplier', 'Status', 'Actions'].map(heading => (
                <th key={heading} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{heading.toUpperCase()}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No products found</td></tr> : filtered.map(product => {
                const productMargin = margin(product);
                const profit = productProfit(product);
                const statusColors = { Active: '#16a34a', Draft: '#f59e0b', 'Out of Stock': '#ef4444' };
                const statusColor = statusColors[product.status] || '#64748b';
                return (
                  <tr key={product.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td data-label="Product" style={{ padding: '10px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <ProductImageGallery product={product} alt={product.name} showControls={false} style={{ width: 36, height: 36, flex: '0 0 36px', borderRadius: 8, background: '#f1f5f9' }} imageStyle={{ padding: 3 }} />
                      <div><div style={{ fontWeight: 600, color: '#0f172a', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>SKU: {product.sku || String(product.id).slice(0, 8)}</div></div>
                    </div></td>
                    <td data-label="Category" style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{categoryLabel(product.category)}</td>
                    <td data-label="Price" style={{ padding: '10px 14px', fontWeight: 700, color: '#2563eb' }}>{format(product.price)}</td>
                    <td data-label="Landed cost" style={{ padding: '10px 14px', color: '#64748b' }}>{hasRecordedCost(product) ? format(unitCost(product) + shippingCost(product)) : '—'}</td>
                    <td data-label="Profit / unit" style={{ padding: '10px 14px', color: profit !== null && profit >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{profit === null ? '—' : format(profit)}</td>
                    <td data-label="Margin" style={{ padding: '10px 14px' }}>{productMargin !== null ? <span style={{ background: productMargin > 30 ? '#f0fdf4' : productMargin > 15 ? '#fffbeb' : '#fef2f2', color: productMargin > 30 ? '#16a34a' : productMargin > 15 ? '#d97706' : '#ef4444', borderRadius: 6, padding: '2px 7px', fontWeight: 700, fontSize: 10 }}>{productMargin}%</span> : '—'}</td>
                    <td data-label="Stock" style={{ padding: '10px 14px', fontWeight: 600, color: (product.stock || 0) < 5 ? '#ef4444' : '#374151' }}>{product.stock ?? 0}{(product.stock || 0) < 5 && product.stock !== undefined && <span style={{ marginLeft: 4, fontSize: 9, color: '#ef4444' }}>LOW</span>}</td>
                    <td data-label="Supplier" style={{ padding: '10px 14px', color: '#64748b' }}>{product.supplier || 'Not assigned'}</td>
                    <td data-label="Status" style={{ padding: '10px 14px' }}><span style={{ background: `${statusColor}18`, color: statusColor, borderRadius: 20, padding: '2px 9px', fontWeight: 700, fontSize: 10 }}>{product.status || 'Active'}</span></td>
                    <td data-label="Actions" style={{ padding: '10px 14px' }}><div style={{ display: 'flex', gap: 6 }}>
                      <button aria-label={`Edit ${product.name}`} onClick={() => openEdit(product)} style={{ padding: '5px 9px', borderRadius: 6, background: '#fff7ed', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Edit2 size={12} color="#c2410c" /></button>
                      <button aria-label={`Delete ${product.name}`} onClick={() => setDeleteId(product.id)} style={{ padding: '5px 9px', borderRadius: 6, background: '#fef2f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={12} color="#ef4444" /></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} onClick={closeModal} />
          <div className="admin-product-edit-modal" style={{ position: 'relative', background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div><h3 style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', margin: 0 }}>{editProduct ? 'Edit Product' : 'Add New Product'}</h3><p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>Add accurate pricing, stock, and product photos.</p></div>
              <button aria-label="Close" onClick={closeModal} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}><X size={16} color="#64748b" /></button>
            </div>

            <div className="admin-product-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}><label style={lbl}>PRODUCT NAME *</label><input autoFocus value={form.name} onChange={event => F('name', event.target.value)} placeholder="e.g. Wireless noise-cancelling headphones" style={inp} /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={lbl}>PRICE ENTRY CURRENCY</label><select value={form.currency} onChange={event => changeInputCurrency(event.target.value)} style={inp}>{CURRENCIES.map(item => <option key={item.code} value={item.code}>{item.flag} {item.code} · {item.name}</option>)}</select><small style={hint}>Entered prices convert to USD for the catalog, then to each shopper’s preferred currency. Changing this choice converts the amounts already entered.</small></div>
              <div><label style={lbl}>CATEGORY *</label><input list="shoppercart-product-categories" value={form.category.replace(/[-_]+/g, ' ')} onChange={event => F('category', event.target.value)} placeholder="Choose or add a category" style={inp} /><datalist id="shoppercart-product-categories">{categories.map(item => <option key={item.slug} value={item.label} />)}</datalist><small style={hint}>Choose a suggestion or type a new category. Save the product to add it to the category list.</small></div>
              <div><label style={lbl}>SKU</label><input value={form.sku} onChange={event => F('sku', event.target.value)} placeholder="Generated if left blank" style={inp} /></div>
              <div><label style={lbl}>SELLING PRICE ({form.currency}) *</label><input type="number" min="0.01" step="0.01" value={form.price} onChange={event => F('price', event.target.value)} placeholder="129.00" style={inp} /></div>
              <div><label style={lbl}>SUPPLIER UNIT COST ({form.currency}) *</label><input type="number" min="0" step="0.01" value={form.cost} onChange={event => F('cost', event.target.value)} placeholder="45.00" style={inp} /></div>
              <div><label style={lbl}>INBOUND SHIPPING / UNIT ({form.currency})</label><input type="number" min="0" step="0.01" value={form.shippingCost} onChange={event => F('shippingCost', event.target.value)} placeholder="0.00" style={inp} /></div>
              <div><label style={lbl}>COMPARE-AT PRICE ({form.currency})</label><input type="number" min="0" step="0.01" value={form.originalPrice} onChange={event => F('originalPrice', event.target.value)} placeholder={form.price || '159.00'} style={inp} /><small style={hint}>Optional crossed-out reference price.</small></div>
              <div><label style={lbl}>STOCK QUANTITY</label><input type="number" min="0" step="1" value={form.stock} onChange={event => F('stock', event.target.value)} placeholder="0" style={inp} /></div>
              <div><label style={lbl}>SUPPLIER</label><input value={form.supplier} onChange={event => F('supplier', event.target.value)} placeholder="Supplier name" style={inp} /></div>
              <div><label style={lbl}>STATUS</label><select value={form.status} onChange={event => F('status', event.target.value)} style={inp}>{STATUS_OPTIONS.map(status => <option key={status}>{status}</option>)}</select></div>
              <div><label style={lbl}>PRODUCT TAG</label><input value={form.tag} onChange={event => F('tag', event.target.value)} placeholder="New, Sale, Limited..." style={inp} /></div>
              <label style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 9, color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><input type="checkbox" checked={form.featured} onChange={event => F('featured', event.target.checked)} /> Feature this product on the home page</label>

              <div style={{ gridColumn: '1/-1', background: '#f8fafc', border: '1px solid #e8edf3', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}><div><label style={{ ...lbl, marginBottom: 2 }}>PRODUCT IMAGES</label><small style={hint}>Paste direct, publicly accessible image URLs. First image is the main photo.</small></div><button type="button" onClick={() => F('images', [...form.images, ''])} style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #fed7aa', color: '#c2410c', background: '#fff7ed', borderRadius: 7, padding: '7px 10px', fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}><ImagePlus size={14} /> Add photo</button></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {form.images.map((image, index) => <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ flex: 1 }}><input type="url" value={image} onChange={event => updateImage(index, event.target.value)} placeholder="https://example.com/product-image.jpg" style={inp} /></div>
                    <ProductImageGallery product={{ image }} alt={`Product preview ${index + 1}`} showControls={false} style={{ width: 46, height: 46, flex: '0 0 46px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff' }} />
                    <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => removeImage(index)} style={{ border: 0, color: '#64748b', background: 'transparent', padding: 6, cursor: 'pointer' }}><X size={16} /></button>
                  </div>)}
                </div>
              </div>

              <div style={{ gridColumn: '1/-1', background: previewReady && previewProfit < 0 ? '#fff7ed' : '#f0fdf4', borderRadius: 9, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '.04em', marginBottom: 8 }}>ESTIMATED UNIT ECONOMICS</div>
                <div className="admin-product-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                  <Metric label="Landed unit cost" value={form.cost !== '' ? formatInputMoney(previewLandedCost) : '—'} />
                  <Metric label="Profit per unit" value={previewReady ? formatInputMoney(previewProfit) : '—'} color={previewProfit >= 0 ? '#16a34a' : '#dc2626'} />
                  <Metric label="Gross margin" value={previewReady ? `${(previewProfit / previewPrice * 100).toFixed(1)}%` : '—'} color={previewProfit >= 0 ? '#16a34a' : '#dc2626'} />
                </div>
                <div style={{ borderTop: '1px solid rgba(148,163,184,.25)', marginTop: 10, paddingTop: 8, fontSize: 11, color: '#475569' }}>Potential profit at current stock ({Math.floor(previewStock)}): <strong style={{ color: previewProfit >= 0 ? '#15803d' : '#b91c1c' }}>{previewReady ? formatInputMoney(previewProfit * previewStock) : '—'}</strong></div>
                <small style={{ ...hint, marginTop: 4 }}>Before payment fees, store expenses, and customer delivery charges.</small>
              </div>

              <div style={{ gridColumn: '1/-1' }}><label style={lbl}>PRODUCT DESCRIPTION</label><textarea value={form.description} onChange={event => F('description', event.target.value)} rows={4} placeholder="Describe the product's real features, materials, compatibility, and what is included." style={{ ...inp, resize: 'vertical' }} /></div>
            </div>

            {formError && <div role="alert" style={{ marginTop: 14, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '9px 11px', fontSize: 12 }}>{formError}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <button onClick={closeModal} disabled={saving} style={{ flex: 1, padding: 10, borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: 10, borderRadius: 9, border: 'none', background: saving ? '#fdba74' : '#f97316', color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Saving…' : editProduct ? 'Save Changes' : 'Add Product'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} onClick={() => setDeleteId(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 14, padding: 24, maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑</div><h3 style={{ fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Delete Product?</h3><p style={{ color: '#64748b', fontSize: 13, margin: '0 0 20px' }}>This will permanently remove this product from your store.</p>
            <div style={{ display: 'flex', gap: 10 }}><button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: 10, borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button><button onClick={async () => { await deleteProduct(deleteId); setDeleteId(null); }} style={{ flex: 1, padding: 10, borderRadius: 9, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Delete</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, color = '#0f172a' }) {
  return <div><div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{label}</div><div style={{ fontSize: 15, fontWeight: 800, color, overflowWrap: 'anywhere' }}>{value}</div></div>;
}

const lbl = { fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 5, display: 'block', letterSpacing: '0.04em' };
const inp = { width: '100%', minWidth: 0, padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f172a' };
const hint = { display: 'block', color: '#64748b', fontSize: 10 };
