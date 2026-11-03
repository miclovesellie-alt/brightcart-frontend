import { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [cart, setCart] = useState([]);
  // The cached user is for immediate rendering; /auth/me validates the server session on load.
  const [user, setUserState] = useState(() => resolveSessionToken());
  const [orders, setOrders] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [page, setPage] = useState(() => sessionGet('brightcart_page', 'home'));
  const [pageParams, setPageParams] = useState(() => sessionGet('brightcart_page_params', {}));

  // The public catalog never includes draft products.
  useEffect(() => {
    let active = true;
    api.getProducts().then(result => {
      if (active) setProducts(getStorefrontProducts(result.data));
    }).catch(error => console.warn('Shoppercart catalog could not be loaded:', error.message));
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

  // Start idle watchdog when an admin logs in; stop it on logout
  useEffect(() => {
    if (user && ['super_admin', 'admin', 'moderator'].includes(user.role)) {
      startIdleWatchdog(() => {
        destroySessionToken();
        setUserState(null);
        sessionSet('brightcart_page', 'home');
        setPage('home');
      });
    } else {
      stopIdleWatchdog();
    }
    return () => stopIdleWatchdog();
  }, [user?.role]);

  const navigate = useCallback((newPage, params = {}) => {
    setPage(newPage);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const addToCart = useCallback((product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + qty }
            : item
        );
      }
      return [...prev, { product, qty }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateQty = useCallback((productId, qty) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.product.id === productId ? { ...item, qty } : item
        )
      );
    }
  }, []);

  const placeOrder = useCallback(async (orderData) => {
    const result = await api.placeOrder({
      ...sanitizeObject(orderData),
      items: cart,
      customer: user?.name || orderData.name,
    });
    const newOrder = result.data;
    setOrders(prev => [newOrder, ...prev.filter(order => order.id !== newOrder.id)]);
    setCart([]);
    return newOrder;
  }, [cart, user]);

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
    setUserState(null);
    setOrders([]);
    setAdminProducts([]);
    setAdminUsers([]);
    setPage('home');
  }, []);

  // Keep storefront products and the admin draft catalog separate.
  const addProduct = useCallback(async (data) => {
    const result = await api.addProduct(sanitizeObject(data));
    const created = result.data;
    setAdminProducts(prev => [created, ...prev]);
    if (created.status !== 'Draft' && created.status !== 'Out of Stock') setProducts(prev => [created, ...prev]);
    return created;
  }, []);

  const updateProduct = useCallback(async (updated) => {
    const result = await api.updateProduct(sanitizeObject(updated));
    const saved = result.data;
    setAdminProducts(prev => prev.map(product => product.id === saved.id ? saved : product));
    if (saved.status !== 'Draft' && saved.status !== 'Out of Stock') {
      setProducts(prev => prev.some(product => product.id === saved.id) ? prev.map(product => product.id === saved.id ? saved : product) : [saved, ...prev]);
    } else {
      setProducts(prev => prev.filter(product => product.id !== saved.id));
    }
    return saved;
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await api.deleteProduct(id);
    setAdminProducts(prev => prev.filter(product => product.id !== id));
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const refreshAdminProducts = useCallback(async () => {
    const [adminResult, publicResult] = await Promise.all([api.getAdminProducts(), api.getProducts()]);
    setAdminProducts(adminResult.data || []);
    setProducts(publicResult.data || []);
    return adminResult.data || [];
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

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  return (
    <StoreContext.Provider value={{
      products,
      adminProducts,
      cart,
      cartCount,
      cartTotal,
      user,
      orders,
      page,
      pageParams,
      navigate,
      addToCart,
      removeFromCart,
      updateQty,
      placeOrder,
      login,
      register,
      logout,
      addProduct,
      updateProduct,
      deleteProduct,
      refreshAdminProducts,
      refreshAdminOrders,
      updateOrder,
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
