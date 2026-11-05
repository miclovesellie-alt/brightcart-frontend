import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, ChevronRight, PackageCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import './NotificationBell.css';

function notificationIcon(type) {
  if (type.includes('dropship') || type.includes('draft')) return Sparkles;
  if (type.includes('product')) return PackageCheck;
  if (type.includes('order')) return ShoppingBag;
  return Bell;
}

function formatTime(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function NotificationBell({ extraNotifications = [], className = '' }) {
  const {
    notifications = [],
    unreadNotificationCount = 0,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    navigate,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeWhenOutside = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeWhenOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeWhenOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const extraItems = extraNotifications.map((item, index) => ({
    id: `attention-${index}`,
    type: 'attention',
    title: item.text || 'Store alert',
    message: 'Open this area to review.',
    page: item.page,
    params: item.params || {},
    readAt: null,
    createdAt: null,
    extra: true,
  }));
  const items = [...extraItems, ...notifications].slice(0, 30);
  const badgeCount = unreadNotificationCount + extraItems.length;

  async function toggleNotifications() {
    const nextOpen = !open;
    setOpen(nextOpen);
    setError('');
    if (nextOpen) {
      try { await refreshNotifications(); }
      catch { setError('Notifications could not refresh. Try again shortly.'); }
    }
  }

  async function openNotification(item) {
    if (item.id && !item.extra && !item.readAt) {
      try { await markNotificationRead(item.id); } catch { /* Navigation remains available if marking read fails. */ }
    }
    setOpen(false);
    if (item.page) {
      const params = { ...(item.params || {}) };
      if (item.page === 'admin-dropshipping' && params.section === 'studio' && item.id) params.notificationId = item.id;
      navigate(item.page, params);
    }
  }

  async function markAllRead() {
    setBusy(true);
    setError('');
    try { await markAllNotificationsRead(); }
    catch { setError('Could not mark notifications as read. Try again.'); }
    finally { setBusy(false); }
  }

  return (
    <div className={`notification-bell notification-bell--${className || 'storefront'}`} ref={rootRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        aria-label={badgeCount ? `Notifications, ${badgeCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={toggleNotifications}
      >
        <Bell size={18} aria-hidden="true" />
        {badgeCount > 0 && <span className="notification-bell__badge">{badgeCount > 99 ? '99+' : badgeCount}</span>}
      </button>

      {open && (
        <section className="notification-bell__popover" role="dialog" aria-label="Notifications">
          <header className="notification-bell__header">
            <div>
              <strong>Notifications</strong>
              <span>{unreadNotificationCount} unread</span>
            </div>
            {unreadNotificationCount > 0 && (
              <button type="button" onClick={markAllRead} disabled={busy}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </header>
          {error && <p className="notification-bell__error" role="status">{error}</p>}
          <div className="notification-bell__list">
            {items.length ? items.map(item => {
              const Icon = notificationIcon(item.type || '');
              const unread = item.extra || !item.readAt;
              return (
                <button
                  type="button"
                  className={`notification-bell__item${unread ? ' is-unread' : ''}`}
                  key={item.id}
                  onClick={() => openNotification(item)}
                >
                  <span className="notification-bell__item-icon"><Icon size={16} /></span>
                  <span className="notification-bell__item-copy">
                    <strong>{item.title}</strong>
                    {item.message && <span>{item.message}</span>}
                    <small>{item.extra ? 'Needs attention' : formatTime(item.createdAt)}</small>
                  </span>
                  {!item.readAt && <span className="notification-bell__unread-dot" aria-label="Unread" />}
                  <ChevronRight size={14} className="notification-bell__item-chevron" />
                </button>
              );
            }) : <div className="notification-bell__empty">You’re all caught up.</div>}
          </div>
        </section>
      )}
    </div>
  );
}
