import { useState } from 'react';
import {
  Users, UserPlus, ShieldCheck, Shield, Eye, Trash2,
  Lock, MoreVertical, X, Check, AlertCircle, UserX, Power,
  Mail, Clock, Calendar, ChevronDown,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const ROLE_META = {
  super_admin: { label: 'Super Admin', bg: '#7c3aed22', color: '#a78bfa', border: '#7c3aed44' },
  admin:       { label: 'Admin',       bg: '#2563eb22', color: '#60a5fa', border: '#2563eb44' },
  moderator:   { label: 'Moderator',   bg: '#05966922', color: '#34d399', border: '#05966944' },
};

const PERMISSIONS = [
  { label: 'Dashboard',  super_admin: true, admin: true,  moderator: true  },
  { label: 'Orders',     super_admin: true, admin: true,  moderator: true  },
  { label: 'Products',   super_admin: true, admin: true,  moderator: false },
  { label: 'Customers',  super_admin: true, admin: true,  moderator: true  },
  { label: 'Analytics',  super_admin: true, admin: true,  moderator: false },
  { label: 'Suppliers',  super_admin: true, admin: false, moderator: false },
  { label: 'Settings',   super_admin: true, admin: false, moderator: false },
  { label: 'Team Mgmt',  super_admin: true, admin: false, moderator: false },
];

function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.moderator;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      letterSpacing: '0.04em',
    }}>
      {role === 'super_admin' && <ShieldCheck size={10} />}
      {role === 'admin' && <Shield size={10} />}
      {role === 'moderator' && <Eye size={10} />}
      {m.label}
    </span>
  );
}

function Avatar({ name, size = 36, role }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const grad = role === 'super_admin'
    ? 'linear-gradient(135deg,#7c3aed,#a21caf)'
    : role === 'admin'
    ? 'linear-gradient(135deg,#2563eb,#0ea5e9)'
    : 'linear-gradient(135deg,#059669,#0d9488)';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: grad,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, color: '#fff', fontSize: size * 0.36, flexShrink: 0,
    }}>{initials}</div>
  );
}

export default function AdminUsers() {
  const {
    user, adminUsers, addAdminUser, removeAdminUser,
    changeAdminPassword, toggleAdminStatus,
  } = useStore();

  const isSuperAdmin = user?.role === 'super_admin';

  const [showAdd, setShowAdd]         = useState(false);
  const [showPwdFor, setShowPwdFor]   = useState(null);
  const [showConfirmDel, setShowConfirmDel] = useState(null);
  const [menuFor, setMenuFor]         = useState(null);
  const [toast, setToast]             = useState(null);

  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [addErrors, setAddErrors] = useState({});
  const [pwdForm, setPwdForm] = useState({ newPwd: '', confirmPwd: '' });
  const [pwdErrors, setPwdErrors] = useState({});

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAdd() {
    const errors = {};
    if (!addForm.name.trim()) errors.name = 'Name required';
    if (!addForm.email.includes('@')) errors.email = 'Valid email required';
    if (addForm.password.length < 10) errors.password = 'Min 10 characters';
    if (adminUsers.find(a => a.email === addForm.email)) errors.email = 'Email already exists';
    if (Object.keys(errors).length) { setAddErrors(errors); return; }

    await addAdminUser({ name: addForm.name, email: addForm.email, password: addForm.password, role: addForm.role });
    setAddForm({ name: '', email: '', password: '', role: 'admin' });
    setAddErrors({});
    setShowAdd(false);
    showToast(`${addForm.role === 'admin' ? 'Admin' : 'Moderator'} "${addForm.name}" added.`);
  }

  async function handleChangePassword() {
    const errors = {};
    if (pwdForm.newPwd.length < 6) errors.newPwd = 'Min 6 characters';
    if (pwdForm.newPwd !== pwdForm.confirmPwd) errors.confirmPwd = 'Passwords do not match';
    if (Object.keys(errors).length) { setPwdErrors(errors); return; }

    await changeAdminPassword(showPwdFor.id, pwdForm.newPwd);
    setPwdForm({ newPwd: '', confirmPwd: '' });
    setPwdErrors({});
    setShowPwdFor(null);
    showToast(`Password updated for ${showPwdFor.name}.`);
  }

  function handleDelete(admin) {
    removeAdminUser(admin.id);
    setShowConfirmDel(null);
    setMenuFor(null);
    showToast(`${admin.name} has been removed.`, 'warning');
  }

  function handleToggleStatus(admin) {
    toggleAdminStatus(admin.id);
    setMenuFor(null);
    showToast(`${admin.name} is now ${admin.status === 'Active' ? 'disabled' : 'active'}.`);
  }

  const totalAdmins     = adminUsers.filter(a => a.role === 'admin').length;
  const totalMods       = adminUsers.filter(a => a.role === 'moderator').length;
  const totalActive     = adminUsers.filter(a => a.status === 'Active').length;

  if (!isSuperAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: '#64748b' }}>
        <ShieldCheck size={48} color="#ef4444" />
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Access Restricted</div>
        <div style={{ fontSize: 13 }}>Only Super Admins can manage the team.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'warning' ? '#7f1d1d' : '#052e16',
          color: toast.type === 'warning' ? '#fca5a5' : '#86efac',
          padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.type === 'warning' ? <AlertCircle size={15} /> : <Check size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Team Management</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Manage admin accounts, roles, and access levels.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff',
            fontWeight: 700, fontSize: 13,
          }}
        >
          <UserPlus size={15} /> Add Team Member
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Members', value: adminUsers.length, icon: Users, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Admins', value: totalAdmins, icon: Shield, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Moderators', value: totalMods, icon: Eye, color: '#059669', bg: '#f0fdf4' },
          { label: 'Active Now', value: totalActive, icon: Power, color: '#f59e0b', bg: '#fffbeb' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{value}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} color="#2563eb" />
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Team Members</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{adminUsers.length} member{adminUsers.length !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Member', 'Role', 'Status', 'Created', 'Last Login', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((admin) => {
                const isMe = admin.email === user.email;
                return (
                  <tr
                    key={admin.id}
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      background: isMe ? 'rgba(37,99,235,0.04)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={admin.name} role={admin.role} />
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {admin.name}
                            {isMe && <span style={{ fontSize: 9, fontWeight: 700, background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: 20 }}>You</span>}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={10} /> {admin.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}><RoleBadge role={admin.role} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                        background: admin.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: admin.status === 'Active' ? '#16a34a' : '#dc2626',
                      }}>
                        {admin.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Calendar size={11} /> {admin.createdAt}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={11} /> {admin.lastLogin}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {!isMe && admin.role !== 'super_admin' ? (
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => setMenuFor(menuFor === admin.id ? null : admin.id)}
                            style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}
                          >
                            Actions <ChevronDown size={11} />
                          </button>
                          {menuFor === admin.id && (
                            <div style={{ position: 'absolute', right: 0, top: 34, zIndex: 50, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 170, overflow: 'hidden' }}>
                              <button
                                onClick={() => { setShowPwdFor(admin); setMenuFor(null); }}
                                style={{ width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#374151', textAlign: 'left' }}
                              >
                                <Lock size={13} color="#2563eb" /> Change Password
                              </button>
                              <button
                                onClick={() => handleToggleStatus(admin)}
                                style={{ width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#374151', textAlign: 'left' }}
                              >
                                {admin.status === 'Active'
                                  ? <><UserX size={13} color="#f59e0b" /> Disable Account</>
                                  : <><Power size={13} color="#059669" /> Enable Account</>
                                }
                              </button>
                              <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />
                              <button
                                onClick={() => { setShowConfirmDel(admin); setMenuFor(null); }}
                                style={{ width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#ef4444', textAlign: 'left' }}
                              >
                                <Trash2 size={13} /> Remove Member
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={16} color="#7c3aed" />
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Role Permissions</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>FEATURE</th>
                {['super_admin', 'admin', 'moderator'].map(r => (
                  <th key={r} style={{ padding: '10px 20px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>
                    <RoleBadge role={r} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((row, i) => (
                <tr key={row.label} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? 'transparent' : '#fafbfc' }}>
                  <td style={{ padding: '10px 20px', fontWeight: 500, color: '#374151' }}>{row.label}</td>
                  {['super_admin', 'admin', 'moderator'].map(r => (
                    <td key={r} style={{ padding: '10px 20px', textAlign: 'center' }}>
                      {row[r]
                        ? <div style={{ display: 'inline-flex', width: 22, height: 22, borderRadius: '50%', background: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}><Check size={13} color="#16a34a" /></div>
                        : <div style={{ display: 'inline-flex', width: 22, height: 22, borderRadius: '50%', background: '#fee2e2', alignItems: 'center', justifyContent: 'center' }}><X size={13} color="#dc2626" /></div>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Modal ── */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 460, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Add Team Member</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Grant admin or moderator access</div>
              </div>
              <button onClick={() => { setShowAdd(false); setAddErrors({}); }} style={{ padding: 6, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}><X size={16} color="#64748b" /></button>
            </div>

            {[
              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'e.g. John Doe' },
              { key: 'email', label: 'Email Address', type: 'email', placeholder: 'e.g. john@example.com' },
              { key: 'password', label: 'Temporary Password', type: 'password', placeholder: 'Min 10 characters' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 5, letterSpacing: '0.04em' }}>{label.toUpperCase()}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={addForm[key]}
                  onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 9, boxSizing: 'border-box',
                    border: `1px solid ${addErrors[key] ? '#ef4444' : '#e2e8f0'}`, fontSize: 13, color: '#0f172a', outline: 'none',
                  }}
                />
                {addErrors[key] && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{addErrors[key]}</div>}
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 5, letterSpacing: '0.04em' }}>ROLE</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { value: 'admin', label: 'Admin', sub: 'Full access except Team & Settings', icon: Shield, color: '#2563eb', bg: '#eff6ff' },
                  { value: 'moderator', label: 'Moderator', sub: 'View orders & customers only', icon: Eye, color: '#059669', bg: '#f0fdf4' },
                ].map(({ value, label, sub, icon: Icon, color, bg }) => (
                  <div
                    key={value}
                    onClick={() => setAddForm(f => ({ ...f, role: value }))}
                    style={{
                      flex: 1, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${addForm.role === value ? color : '#e2e8f0'}`,
                      background: addForm.role === value ? bg : '#f8fafc',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Icon size={14} color={color} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: addForm.role === value ? color : '#374151' }}>{label}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.4 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowAdd(false); setAddErrors({}); }} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Cancel</button>
              <button onClick={handleAdd} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff' }}>Add Member</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showPwdFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 400, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Change Password</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>For {showPwdFor.name}</div>
              </div>
              <button onClick={() => { setShowPwdFor(null); setPwdErrors({}); }} style={{ marginLeft: 'auto', padding: 6, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}><X size={16} color="#64748b" /></button>
            </div>

            {[
              { key: 'newPwd', label: 'New Password', placeholder: 'Min 6 characters' },
              { key: 'confirmPwd', label: 'Confirm Password', placeholder: 'Re-enter new password' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 5, letterSpacing: '0.04em' }}>{label.toUpperCase()}</label>
                <input
                  type="password"
                  placeholder={placeholder}
                  value={pwdForm[key]}
                  onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 9, boxSizing: 'border-box',
                    border: `1px solid ${pwdErrors[key] ? '#ef4444' : '#e2e8f0'}`, fontSize: 13, color: '#0f172a', outline: 'none',
                  }}
                />
                {pwdErrors[key] && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{pwdErrors[key]}</div>}
              </div>
            ))}

            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#92400e', marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
              <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              The user will need to log in again with their new password.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowPwdFor(null); setPwdErrors({}); }} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Cancel</button>
              <button onClick={handleChangePassword} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff' }}>Update Password</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {showConfirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 380, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={24} color="#ef4444" />
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Remove Team Member?</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 22, lineHeight: 1.6 }}>
              <strong>{showConfirmDel.name}</strong> will lose all admin access immediately. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowConfirmDel(null)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Cancel</button>
              <button onClick={() => handleDelete(showConfirmDel)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff' }}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {menuFor && <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuFor(null)} />}
    </div>
  );
}
