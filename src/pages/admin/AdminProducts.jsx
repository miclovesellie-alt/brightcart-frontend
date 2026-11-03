import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';

const CATEGORIES = [
  { label: 'All',                slug: 'All' },
  { label: 'Phones',             slug: 'phones' },
  { label: 'Phone Accessories',  slug: 'phone-accessories' },
  { label: 'Laptop Accessories', slug: 'laptop-accessories' },
  { label: 'Electrical',         slug: 'electrical' },
];

const STATUS_OPTIONS = ['Active', 'Draft', 'Out of Stock'];
const SUPPLIERS = ['AliExpress', 'CJ Dropshipping', 'Spocket', 'Zendrop', 'Oberlo'];

const PRODUCT_ICONS = [
  { label: 'Phone',    value: 'phone'    },
  { label: 'Laptop',   value: 'laptop'   },
  { label: 'Earbuds',  value: 'earbuds'  },
  { label: 'Charger',  value: 'charger'  },
  { label: 'Monitor',  value: 'monitor'  },
  { label: 'Keyboard', value: 'keyboard' },
  { label: 'Mouse',    value: 'mouse'    },
  { label: 'Hub',      value: 'hub'      },
  { label: 'Speaker',  value: 'speaker'  },
  { label: 'Fan',      value: 'fan'      },
  { label: 'Watch',    value: 'watch'    },
  { label: 'Case',     value: 'case'     },
];

const ICON_DISPLAY = {
  phone: '📱', laptop: '💻', earbuds: '🎧', charger: '🔋',
  monitor: '🖥', keyboard: '⌨', mouse: '🖱', hub: '🔌',
  speaker: '🔊', fan: '💨', watch: '⌚', case: '📦',
};

function getIcon(p) {
  if (p.icon && ICON_DISPLAY[p.icon]) return ICON_DISPLAY[p.icon];
  if (p.image && !p.image.startsWith('/')) return p.image; // legacy emoji stored directly
  return '📦';
}

const EMPTY_FORM = {
  name: '', category: 'phones', price: '', originalPrice: '', cost: '',
  stock: '', description: '', supplier: 'AliExpress', status: 'Active',
  sku: '', icon: 'phone',
};

export default function AdminProducts() {
  const { adminProducts: products, addProduct, updateProduct, deleteProduct } = useStore();
  const { format } = useCurrency();
  const [search, setSearch]       = useState('');
  const [cat, setCat]             = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [deleteId, setDeleteId]   = useState(null);

  const filtered = products.filter(p => {
    const matchCat = cat === 'All' || p.category === cat;
    const matchQ   = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const openNew = () => { setForm(EMPTY_FORM); setEditProduct(null); setShowModal(true); };
  const openEdit = p => {
    setForm({
      ...EMPTY_FORM, ...p,
      price:         String(p.price || ''),
      originalPrice: String(p.originalPrice || ''),
      cost:          String(p.cost || ''),
      stock:         String(p.stock || 0),
      icon:          p.icon || 'phone',
    });
    setEditProduct(p);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditProduct(null); };

  const handleSave = () => {
    const data = {
      ...form,
      price:         parseFloat(form.price) || 0,
      originalPrice: parseFloat(form.originalPrice) || parseFloat(form.price) || 0,
      cost:          parseFloat(form.cost) || 0,
      stock:         parseInt(form.stock) || 0,
    };
    if (editProduct) updateProduct({ ...editProduct, ...data });
    else addProduct(data);
    closeModal();
  };

  const margin = p => {
    if (!p.cost || !p.price) return null;
    return Math.round(((p.price - p.cost) / p.price) * 100);
  };

  const F = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', margin: 0 }}>Products</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>
            {products.length} products &mdash; {filtered.length} shown
          </p>
        </div>
        <button
          onClick={openNew}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(({ label, slug }) => (
            <button key={slug} onClick={() => setCat(slug)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: cat === slug ? '#2563eb' : '#fff',
                color: cat === slug ? '#fff' : '#374151',
                border: `1px solid ${cat === slug ? '#2563eb' : '#e2e8f0'}`,
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf3', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Product', 'Category', 'Price', 'Cost', 'Margin', 'Stock', 'Supplier', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No products found</td></tr>
              ) : filtered.map(p => {
                const m = margin(p);
                const statusColors = { Active: '#16a34a', Draft: '#f59e0b', 'Out of Stock': '#ef4444' };
                const sc = statusColors[p.status] || '#64748b';
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                          {getIcon(p)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>SKU: {p.sku || String(p.id).slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{p.category}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#2563eb' }}>{format(p.price)}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{p.cost ? format(p.cost) : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {m !== null ? (
                        <span style={{ background: m > 30 ? '#f0fdf4' : m > 15 ? '#fffbeb' : '#fef2f2', color: m > 30 ? '#16a34a' : m > 15 ? '#d97706' : '#ef4444', borderRadius: 6, padding: '2px 7px', fontWeight: 700, fontSize: 10 }}>{m}%</span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: (p.stock || 0) < 5 ? '#ef4444' : '#374151' }}>
                      {p.stock ?? 0}
                      {(p.stock || 0) < 5 && p.stock !== undefined && <span style={{ marginLeft: 4, fontSize: 9, color: '#ef4444' }}>LOW</span>}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{p.supplier || 'AliExpress'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: sc + '18', color: sc, borderRadius: 20, padding: '2px 9px', fontWeight: 700, fontSize: 10 }}>{p.status || 'Active'}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(p)} style={{ padding: '5px 9px', borderRadius: 6, background: '#eff6ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Edit2 size={12} color="#2563eb" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} style={{ padding: '5px 9px', borderRadius: 6, background: '#fef2f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={12} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} onClick={closeModal} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', margin: 0 }}>{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={closeModal} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}><X size={16} color="#64748b" /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Product Name */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>PRODUCT NAME *</label>
                <input value={form.name} onChange={e => F('name', e.target.value)} placeholder="e.g. ProBuds X3 Wireless Earbuds" style={inp} />
              </div>

              {/* Selling Price */}
              <div>
                <label style={lbl}>SELLING PRICE ($) *</label>
                <input type="number" value={form.price} onChange={e => F('price', e.target.value)} placeholder="129.00" style={inp} />
              </div>

              {/* Supplier Cost */}
              <div>
                <label style={lbl}>SUPPLIER COST ($)</label>
                <input type="number" value={form.cost} onChange={e => F('cost', e.target.value)} placeholder="45.00" style={inp} />
              </div>

              {/* Compare Price */}
              <div>
                <label style={lbl}>COMPARE PRICE ($)</label>
                <input type="number" value={form.originalPrice} onChange={e => F('originalPrice', e.target.value)} placeholder="159.00" style={inp} />
              </div>

              {/* Stock */}
              <div>
                <label style={lbl}>STOCK QUANTITY</label>
                <input type="number" value={form.stock} onChange={e => F('stock', e.target.value)} placeholder="100" style={inp} />
              </div>

              {/* Category */}
              <div>
                <label style={lbl}>CATEGORY</label>
                <select value={form.category} onChange={e => F('category', e.target.value)} style={inp}>
                  {CATEGORIES.filter(c => c.slug !== 'All').map(c => (
                    <option key={c.slug} value={c.slug}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Supplier */}
              <div>
                <label style={lbl}>SUPPLIER</label>
                <select value={form.supplier} onChange={e => F('supplier', e.target.value)} style={inp}>
                  {SUPPLIERS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={lbl}>STATUS</label>
                <select value={form.status} onChange={e => F('status', e.target.value)} style={inp}>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Margin preview */}
              {form.price && form.cost && (
                <div style={{ gridColumn: '1/-1', background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Margin</div>
                    <div style={{ fontWeight: 800, color: '#16a34a', fontSize: 18 }}>
                      {Math.round(((parseFloat(form.price) - parseFloat(form.cost)) / parseFloat(form.price)) * 100)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Profit / unit</div>
                    <div style={{ fontWeight: 800, color: '#16a34a', fontSize: 18 }}>
                      ${(parseFloat(form.price) - parseFloat(form.cost)).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>DESCRIPTION</label>
                <textarea value={form.description} onChange={e => F('description', e.target.value)} rows={3} placeholder="Product description..." style={{ ...inp, resize: 'vertical' }} />
              </div>

              {/* Icon picker */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>PRODUCT ICON</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PRODUCT_ICONS.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => F('icon', value)}
                      title={label}
                      style={{
                        fontSize: 20, width: 40, height: 40, borderRadius: 8, cursor: 'pointer',
                        border: form.icon === value ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: form.icon === value ? '#eff6ff' : '#f8fafc',
                      }}
                    >
                      {ICON_DISPLAY[value]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <button onClick={closeModal} style={{ flex: 1, padding: 10, borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} style={{ flex: 2, padding: 10, borderRadius: 9, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {editProduct ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} onClick={() => setDeleteId(null)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 14, padding: 24, maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑</div>
            <h3 style={{ fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Delete Product?</h3>
            <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 20px' }}>This will permanently remove this product from your store.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: 10, borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { deleteProduct(deleteId); setDeleteId(null); }} style={{ flex: 1, padding: 10, borderRadius: 9, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// shared input/label styles
const lbl = { fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 5, display: 'block', letterSpacing: '0.04em' };
const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f172a' };
