import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { getStorefrontProducts } from '../utils/catalog';
import {
  sanitizeObject,
  resolveSessionToken,
  getSessionToken,
  saveSession,
  destroySessionToken,
  startIdleWatchdog,
  stopIdleWatchdog,
} from '../utils/security';

// ── Session persistence helpers (page routing only) ───────────────────────────
function sessionGet(key, fallback) {
  try { const r = sessionStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function sessionSet(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function cachedPublicProducts() {
  try {
    const cached = JSON.parse(localStorage.getItem('shoppercart_public_products_v1') || 'null');
    if (!cached || Date.now() - Number(cached.savedAt || 0) > 7 * 24 * 60 * 60 * 1000) return [];
    return getStorefrontProducts(cached.products);
  } catch { return []; }
}

const EMPTY_STORE_CONTACTS = { supportEmail: '', whatsappNumber: '', socials: {} };

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(cachedPublicProducts);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [storeContacts, setStoreContacts] = useState(EMPTY_STORE_CONTACTS);
  const [adminProducts, setAdminProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('shoppercart_wishlist_v1') || '[]');
      return Array.isArray(ids) ? [...new Set(ids.map(String))] : [];
    } catch { return []; }
  });
  // The cached user is for immediate rendering; /auth/me validates the server session on load.
  const [user, setUserState] = useState(() => resolveSessionToken());
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [page, setPage] = useState(() => sessionGet('brightcart_page', 'home'));
  const [pageParams, setPageParams] = useState(() => sessionGet('brightcart_page_params', {}));
  const [pageHistory, setPageHistory] = useState(() => {
    const history = sessionGet('brightcart_page_history', []);
    return Array.isArray(history) ? history.filter(item => item && typeof item.page === 'string') : [];
  });
  const pageRef = useRef(page);
  const pageParamsRef = useRef(pageParams);
  const pageHistoryRef = useRef(pageHistory);
  const wishlistSyncSkipRef = useRef(false);
  pageRef.current = page;
  pageParamsRef.current = pageParams;
  pageHistoryRef.current = pageHistory;

  useEffect(() => {
    try { localStorage.setItem('shoppercart_wishlist_v1', JSON.stringify(wishlistIds)); } catch {}
  }, [wishlistIds]);

  useEffect(() => {
    if (!user?.id || user.role !== 'customer') return;
    wishlistSyncSkipRef.current = true;
    const savedIds = Array.isArray(user.wishlistProductIds) ? [...new Set(user.wishlistProductIds.map(String))] : [];
    setWishlistIds(savedIds);
  }, [user?.id, user?.wishlistProductIds, user?.role]);

  useEffect(() => {
    if (!user?.id || user.role !== 'customer') return;
    if (wishlistSyncSkipRef.current) {
      wishlistSyncSkipRef.current = false;
      return;
    }
    const timeout = window.setTimeout(() => {
      api.updateAccountWishlist(wishlistIds.map(Number)).catch(error => console.warn('Saved items could not sync to the account:', error.message));
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [wishlistIds, user?.id, user?.role]);

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return [];
    }
    const result = await api.getNotifications();
    const loaded = Array.isArray(result.data) ? result.data : [];
    setNotifications(loaded);
    return loaded;
  }, [user?.id, user?.role]);

  const markNotificationRead = useCallback(async id => {
    const result = await api.markNotificationRead(id);
    setNotifications(previous => previous.map(item => item.id === id ? result.data : item));
    return result.data;
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    await api.markAllNotificationsRead();
    const readAt = new Date().toISOString();
    setNotifications(previous => previous.map(item => item.readAt ? item : { ...item, readAt }));
  }, []);

  // The public catalog never includes draft products.
  useEffect(() => {
    let active = true;
    api.getProducts().then(result => {
      if (active) {
        const publicProducts = getStorefrontProducts(result.data);
        setProducts(publicProducts);
        setCatalogLoading(false);
        try { localStorage.setItem('shoppercart_public_products_v1', JSON.stringify({ savedAt: Date.now(), products: publicProducts })); } catch {}
      }
    }).catch(error => {
      if (active) setCatalogLoading(false);
      console.warn('Shoppercart catalog could not be loaded:', error.message);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    api.getStoreSettings().then(result => {
      if (active) setStoreContacts({ ...EMPTY_STORE_CONTACTS, ...(result.data || {}) });
    }).catch(error => console.warn('Shoppercart store contact settings could not be loaded:', error.message));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!getSessionToken()) return;
    let active = true;
    api.getMe().then(result => {
      if (active) setUserState(result.user);
    }).catch(() => {
      if (active) setUserState(null);
      destroySessionToken();
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return undefined;
    }
    let active = true;
    const loadNotifications = () => {
      api.getNotifications().then(result => {
        if (active) setNotifications(Array.isArray(result.data) ? result.data : []);
      }).catch(() => {});
    };
    loadNotifications();
    const refreshTimer = window.setInterval(loadNotifications, 30_000);
    window.addEventListener('focus', loadNotifications);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', loadNotifications);
    };
  }, [user?.id, user?.role]);

  // Load only the signed-in user's orders. Admin pages use a separate protected endpoint.
  useEffect(() => {
    let active = true;
    const adminRole = ['super_admin', 'admin', 'moderator'].includes(user?.role);
    const editorRole = ['super_admin', 'admin'].includes(user?.role);
    if (!user) {
      setOrders([]);
      setAdminProducts([]);
      setAdminUsers([]);
      return () => { active = false; };
    }

    const loadAccountData = async () => {
      try {
        if (editorRole) {
          const [productResult, orderResult] = await Promise.all([api.getAdminProducts(), api.getAdminOrders()]);
          if (active) {
            setAdminProducts(productResult.data || []);
            setOrders(orderResult.data || []);
          }
        } else if (adminRole) {
          const orderResult = await api.getAdminOrders();
          if (active) setOrders(orderResult.data || []);
        } else {
          const orderResult = await api.getAccountOrders();
          if (active) setOrders(orderResult.data || []);
        }
        if (user.role === 'super_admin') {
          const userResult = await api.getAdminUsers();
          if (active) setAdminUsers(userResult.data || []);
        }
      } catch (error) {
        if (error.status !== 403) console.warn('Could not load account data:', error.message);
      }
    };
    loadAccountData();
    return () => { active = false; };
  }, [user?.id, user?.role]);

  // Keep page routing in sessionStorage
  useEffect(() => { sessionSet('brightcart_page', page); }, [page]);
  useEffect(() => { sessionSet('brightcart_page_params', pageParams); }, [pageParams]);
  useEffect(() => { sessionSet('brightcart_page_history', pageHistory); }, [pageHistory]);

  // Start idle watchdog when an admin logs in; stop it on logout
  useEffect(() => {
    if (user && ['super_admin', 'admin', 'moderator'].includes(user.role)) {
      startIdleWatchdog(() => {
        destroySessionToken();
        setUserState(null);
        sessionSet('brightcart_page', 'home');
        sessionSet('brightcart_page_params', {});
        sessionSet('brightcart_page_history', []);
        pageRef.current = 'home';
        pageParamsRef.current = {};
        pageHistoryRef.current = [];
        setPageParams({});
        setPageHistory([]);
        setPage('home');
      });
    } else {
      stopIdleWatchdog();
    }
    return () => stopIdleWatchdog();
  }, [user?.role]);

  const navigate = useCallback((newPage, params = {}) => {
    const nextParams = params || {};
    const currentPage = pageRef.current;
    const currentParams = pageParamsRef.current || {};
    if (currentPage !== newPage || JSON.stringify(currentParams) !== JSON.stringify(nextParams)) {
      const nextHistory = [...pageHistoryRef.current, { page: currentPage, pageParams: currentParams }].slice(-40);
      pageHistoryRef.current = nextHistory;
      setPageHistory(nextHistory);
    }
    pageRef.current = newPage;
    pageParamsRef.current = nextParams;
    setPage(newPage);
    setPageParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    const history = pageHistoryRef.current;
    const previous = history[history.length - 1];
    if (previous) {
      const nextHistory = history.slice(0, -1);
      const nextParams = previous.pageParams || {};
      pageHistoryRef.current = nextHistory;
      pageRef.current = previous.page;
      pageParamsRef.current = nextParams;
      setPageHistory(nextHistory);
      setPage(previous.page);
      setPageParams(nextParams);
    } else if (pageRef.current !== 'home') {
      pageRef.current = 'home';
      pageParamsRef.current = {};
      setPage('home');
      setPageParams({});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const cartKeyFor = (product, variant) => {
    const variantKey = String(variant?.id || variant?.color || variant?.name || '').trim().toLowerCase();
    return `${product.id}:${variantKey || 'default'}`;
  };

  const toggleWishlist = useCallback(productId => {
    const id = String(productId);
    setWishlistIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);
  }, []);

  const removeFromWishlist = useCallback(productId => {
    const id = String(productId);
    setWishlistIds(previous => previous.filter(value => value !== id));
  }, []);

  const addToCart = useCallback((product, qty = 1, variant = null) => {
    const cartKey = cartKeyFor(product, variant);
    const variantSnapshot = variant ? {
      id: String(variant.id || variant.color || variant.name || ''),
      name: String(variant.name || variant.color || ''),
      color: String(variant.color || variant.name || ''),
      image: String(variant.image || variant.imageUrl || ''),
      images: Array.isArray(variant.images) ? variant.images : [],
      sku: String(variant.sku || ''),
      price: variant.price != null && Number.isFinite(Number(variant.price)) ? Number(variant.price) : null,
      originalPrice: variant.originalPrice != null && Number.isFinite(Number(variant.originalPrice)) ? Number(variant.originalPrice) : null,
    } : null;
    const cartProduct = variantSnapshot ? {
      ...product,
      image: variantSnapshot.image || product.image,
      images: variantSnapshot.images.length ? variantSnapshot.images : product.images,
      price: variantSnapshot.price != null ? variantSnapshot.price : product.price,
      originalPrice: variantSnapshot.originalPrice != null ? variantSnapshot.originalPrice : product.originalPrice,
    } : product;
    setCart(prev => {
      const existing = prev.find(item => (item.cartKey || cartKeyFor(item.product, item.variant)) === cartKey);
      if (existing) {
        return prev.map(item =>
          (item.cartKey || cartKeyFor(item.product, item.variant)) === cartKey
            ? { ...item, qty: item.qty + qty }
            : item
        );
      }
      return [...prev, { cartKey, product: cartProduct, variant: variantSnapshot, qty }];
    });
  }, []);

  const removeFromCart = useCallback((lineKey) => {
    setCart(prev => prev.filter(item => {
      const key = item.cartKey || cartKeyFor(item.product, item.variant);
      if (key === lineKey) return false;
      return !(String(lineKey) === String(item.product.id) && !item.variant);
    }));
  }, []);

  const updateQty = useCallback((lineKey, qty) => {
    if (qty <= 0) {
      removeFromCart(lineKey);
    } else {
      setCart(prev =>
        prev.map(item =>
          (item.cartKey || cartKeyFor(item.product, item.variant)) === lineKey
            || (String(lineKey) === String(item.product.id) && !item.variant)
            ? { ...item, qty }
            : item
        )
      );
    }
  }, [removeFromCart]);

  const placeOrder = useCallback(async (orderData) => {
    const result = await api.placeOrder({
      ...sanitizeObject(orderData),
      items: cart,
      customer: user?.name || orderData.name,
    });
    const newOrder = result.data;
    setOrders(prev => [newOrder, ...prev.filter(order => order.id !== newOrder.id)]);
    await refreshNotifications().catch(() => {});
    setCart([]);
    return newOrder;
  }, [cart, user, refreshNotifications]);

  const completePaystackCheckout = useCallback(async reference => {
    const result = await api.verifyCheckoutPayment(reference);
    const saved = result.data;
    setOrders(prev => [saved, ...prev.filter(order => order.id !== saved.id)]);
    if (saved.paymentStatus === 'paid') setCart([]);
    return saved;
  }, []);

  const acceptSession = useCallback((result) => {
    saveSession(result.token, result.user, result.expiresAt);
    setUserState(result.user);
    return result.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await api.login(email, password);
    return acceptSession(result);
  }, [acceptSession]);

  const register = useCallback(async (userData) => {
    const result = await api.register(userData);
    return acceptSession(result);
  }, [acceptSession]);

  const addAdminUser = useCallback(async (userData) => {
    const result = await api.addAdminUser(userData);
    setAdminUsers(prev => [result.data, ...prev]);
    return result.data;
  }, []);

  const removeAdminUser = useCallback(async (id) => {
    await api.removeAdminUser(id);
    setAdminUsers(prev => prev.filter(userItem => userItem.id !== id));
  }, []);

  const changeAdminPassword = useCallback(async (id, newPassword) => {
    await api.updateAdminUser(id, { password: newPassword });
  }, []);

  const toggleAdminStatus = useCallback(async (id) => {
    const member = adminUsers.find(item => item.id === id);
    if (!member) return;
    const status = member.status === 'Active' ? 'Disabled' : 'Active';
    const result = await api.updateAdminUser(id, { status });
    setAdminUsers(prev => prev.map(item => item.id === id ? result.data : item));
  }, [adminUsers]);

  const logout = useCallback(() => {
    destroySessionToken();
    sessionStorage.removeItem('brightcart_page');
    sessionStorage.removeItem('brightcart_page_params');
    sessionStorage.removeItem('brightcart_page_history');
    pageHistoryRef.current = [];
    pageRef.current = 'home';
    pageParamsRef.current = {};
    setUserState(null);
    setOrders([]);
    setNotifications([]);
    setAdminProducts([]);
    setAdminUsers([]);
    setPage('home');
    setPageParams({});
    setPageHistory([]);
  }, []);

  // Keep storefront products and the admin draft catalog separate.
  const addProduct = useCallback(async (data) => {
    const result = await api.addProduct(sanitizeObject(data));
    const created = result.data;
    setAdminProducts(prev => [created, ...prev]);
    if (created.status !== 'Draft' && created.status !== 'Out of Stock') setProducts(prev => [created, ...prev]);
    return created;
  }, []);

  const updateProduct = useCallback(async (updated, options = {}) => {
    const result = await api.updateProduct(sanitizeObject(updated), options);
    const saved = result.data;
    setAdminProducts(prev => prev.map(product => product.id === saved.id ? saved : product));
    if (saved.status !== 'Draft' && saved.status !== 'Out of Stock') {
      setProducts(prev => prev.some(product => product.id === saved.id) ? prev.map(product => product.id === saved.id ? saved : product) : [saved, ...prev]);
    } else {
      setProducts(prev => prev.filter(product => product.id !== saved.id));
    }
    return saved;
  }, []);

  const publishProductDraft = useCallback(async (id, checks) => {
    const result = await api.publishDraft(id, checks);
    const published = result.data;
    setAdminProducts(previous => [published, ...previous.filter(product => product.id !== published.id)]);
    setProducts(previous => [published, ...previous.filter(product => product.id !== published.id)]);
    return published;
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await api.deleteProduct(id);
    setAdminProducts(prev => prev.filter(product => product.id !== id));
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const refreshAdminProducts = useCallback(async () => {
    const [adminResult, publicResult] = await Promise.all([api.getAdminProducts(), api.getProducts()]);
    setAdminProducts(adminResult.data || []);
    const publicProducts = publicResult.data || [];
    setProducts(publicProducts);
    try { localStorage.setItem('shoppercart_public_products_v1', JSON.stringify({ savedAt: Date.now(), products: publicProducts })); } catch {}
    return adminResult.data || [];
  }, []);

  const updateStoreContacts = useCallback(async settings => {
    const result = await api.updateAdminStoreSettings(settings);
    const saved = result.data || {};
    setStoreContacts(current => ({
      ...current,
      supportEmail: saved.supportEmail || '',
      whatsappNumber: saved.whatsappNumber || '',
      socials: saved.socials || {},
    }));
    return result;
  }, []);

  const refreshAdminOrders = useCallback(async () => {
    const result = await api.getAdminOrders();
    setOrders(result.data || []);
    return result.data || [];
  }, []);

  const updateOrder = useCallback(async (id, patch) => {
    const result = await api.updateOrder(id, sanitizeObject(patch));
    const saved = result.data;
    setOrders(prev => prev.map(order => order.id === saved.id ? saved : order));
    return saved;
  }, []);

  const verifyPaystackOrder = useCallback(async id => {
    const result = await api.verifyPaystackOrder(id);
    const saved = result.data;
    setOrders(prev => prev.map(order => order.id === saved.id ? saved : order));
    return saved;
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.product.price || 0) * item.qty, 0);
  const unreadNotificationCount = notifications.filter(notification => !notification.readAt).length;

  return (
    <StoreContext.Provider value={{
      products,
      catalogLoading,
      wishlistIds,
      wishlistProducts: products.filter(product => wishlistIds.includes(String(product.id))),
      toggleWishlist,
      removeFromWishlist,
      storeContacts,
      updateStoreContacts,
      adminProducts,
      cart,
      cartCount,
      cartTotal,
      user,
      orders,
      notifications,
      unreadNotificationCount,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      page,
      pageParams,
      canGoBack: pageHistory.length > 0 || page !== 'home',
      navigate,
      goBack,
      addToCart,
      removeFromCart,
      updateQty,
      placeOrder,
      completePaystackCheckout,
      login,
      register,
      logout,
      addProduct,
      updateProduct,
      publishProductDraft,
      deleteProduct,
      refreshAdminProducts,
      refreshAdminOrders,
      updateOrder,
      verifyPaystackOrder,
      adminUsers,
      addAdminUser,
      removeAdminUser,
      changeAdminPassword,
      toggleAdminStatus,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export default StoreContext;
