import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  hashPassword,
  SUPER_ADMIN_HASH,
  sanitizeObject,
  createSessionToken,
  resolveSessionToken,
  destroySessionToken,
  recordFailedAttempt,
  recordSuccessfulLogin,
  isLockedOut,
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

const INITIAL_PRODUCTS = [
  // Phones (8)
  { id: 1, name: 'BrightPhone Pro 15', category: 'phones', price: 899, originalPrice: 1099, rating: 4.8, reviews: 312, stock: 45, image: '/phone.jpg', description: 'Flagship smartphone with 6.7" AMOLED display, 200MP camera, and 5000mAh battery. Snapdragon 8 Gen 3 processor.', featured: true, tag: 'Best Seller' },
  { id: 2, name: 'NovaSpark Z12 Ultra', category: 'phones', price: 749, originalPrice: 899, rating: 4.6, reviews: 198, stock: 30, image: '/phone.jpg', description: 'Premium mid-range phone with 6.5" display, 108MP triple camera, and 4800mAh fast-charging battery.', featured: false, tag: 'New' },
  { id: 3, name: 'LunaX Flip Edition', category: 'phones', price: 1099, originalPrice: 1299, rating: 4.7, reviews: 87, stock: 15, image: '/phone.jpg', description: 'Foldable smartphone with 7.2" inner display, compact folded design, and premium build quality.', featured: true, tag: 'Premium' },
  { id: 4, name: 'SwiftEdge 5G Lite', category: 'phones', price: 299, originalPrice: 399, rating: 4.3, reviews: 456, stock: 100, image: '/phone.jpg', description: 'Affordable 5G phone with 6.4" display, 48MP camera, and all-day battery life.', featured: false, tag: 'Value Pick' },
  { id: 5, name: 'TitanV Rugged Phone', category: 'phones', price: 549, originalPrice: 649, rating: 4.5, reviews: 134, stock: 28, image: '/phone.jpg', description: 'Military-grade rugged smartphone with IP68 rating, thermal camera, and massive 6000mAh battery.', featured: false, tag: 'Rugged' },
  { id: 6, name: 'PureLight Camera Phone', category: 'phones', price: 679, originalPrice: 799, rating: 4.9, reviews: 203, stock: 22, image: '/phone.jpg', description: 'Camera-first smartphone with 1-inch sensor, periscope zoom lens, and AI photography features.', featured: false, tag: 'Top Rated' },
  { id: 7, name: 'BrightPhone SE Mini', category: 'phones', price: 399, originalPrice: 479, rating: 4.4, reviews: 289, stock: 60, image: '/phone.jpg', description: 'Compact 5.4" display, powerful A17 chip, stellar camera in a smaller form factor.', featured: false, tag: 'Compact' },
  { id: 8, name: 'GalaxyRise 8 Pro', category: 'phones', price: 829, originalPrice: 999, rating: 4.7, reviews: 167, stock: 35, image: '/phone.jpg', description: 'Stunning curved display, S-Pen included, 45W super-fast charging, DeX desktop mode.', featured: false, tag: 'S-Pen' },

  // Phone Accessories (10)
  { id: 9, name: 'ProBuds X3 Wireless Earbuds', category: 'phone-accessories', price: 129, originalPrice: 179, rating: 4.7, reviews: 521, stock: 150, image: '/earbuds.jpg', description: 'Active Noise Cancellation, 8hr playtime + 24hr case, IPX5 water resistant, hi-fi audio.', featured: true, tag: 'Top Seller' },
  { id: 10, name: 'TurboCharge 65W GaN Charger', category: 'phone-accessories', price: 49, originalPrice: 69, rating: 4.8, reviews: 843, stock: 200, image: '/charger.jpg', description: 'GaN technology 65W USB-C charger, charges laptop + phone simultaneously, foldable prongs.', featured: true, tag: 'Essential' },
  { id: 11, name: 'MagShield Wireless Pad', category: 'phone-accessories', price: 39, originalPrice: 59, rating: 4.5, reviews: 367, stock: 120, image: '/charger.jpg', description: '15W MagSafe-compatible wireless charging pad with LED status indicator and anti-slip base.', featured: false, tag: 'Wireless' },
  { id: 12, name: 'ArmorCase Titan Series', category: 'phone-accessories', price: 29, originalPrice: 45, rating: 4.6, reviews: 612, stock: 300, image: '/case.jpg', description: 'Military-grade drop protection, raised bezels, magsafe compatible, matte finish.', featured: false, tag: 'Protection' },
  { id: 13, name: 'ClearView Screen Shield', category: 'phone-accessories', price: 19, originalPrice: 29, rating: 4.4, reviews: 934, stock: 500, image: '/case.jpg', description: 'Tempered glass screen protector, 9H hardness, anti-fingerprint coating, easy alignment kit.', featured: false, tag: 'Pack of 2' },
  { id: 14, name: 'SoundBar Mini BT Speaker', category: 'phone-accessories', price: 79, originalPrice: 109, rating: 4.6, reviews: 278, stock: 85, image: '/speaker.jpg', description: '360° surround sound, IPX7 waterproof, 20hr battery, RGB ambient light effects.', featured: false, tag: 'Waterproof' },
  { id: 15, name: 'FlexMount Car Holder', category: 'phone-accessories', price: 25, originalPrice: 39, rating: 4.5, reviews: 445, stock: 180, image: '/case.jpg', description: 'Universal dashboard/vent mount, one-hand operation, 360° rotation, fits 4-7" phones.', featured: false, tag: 'Universal' },
  { id: 16, name: 'PowerBank Ultra 20000', category: 'phone-accessories', price: 59, originalPrice: 85, rating: 4.7, reviews: 389, stock: 95, image: '/charger.jpg', description: '20000mAh, 22.5W fast charge, USB-C + 2x USB-A ports, digital battery display.', featured: false, tag: '3 Ports' },
  { id: 17, name: 'NeckBand Pro Sport', category: 'phone-accessories', price: 45, originalPrice: 65, rating: 4.3, reviews: 201, stock: 70, image: '/earbuds.jpg', description: 'Magnetic earbuds, IPX5, 10hr battery, deep bass, inline mic for calls.', featured: false, tag: 'Sport' },
  { id: 18, name: 'SmartWatch Sync Band', category: 'phone-accessories', price: 99, originalPrice: 139, rating: 4.6, reviews: 316, stock: 55, image: '/smartwatch.jpg', description: 'Heart rate, SpO2, sleep tracking, 7-day battery, AMOLED always-on display.', featured: false, tag: 'Health' },

  // Laptop Accessories (10)
  { id: 19, name: 'UltraHub Pro 12-in-1', category: 'laptop-accessories', price: 89, originalPrice: 129, rating: 4.8, reviews: 487, stock: 110, image: '/hub.jpg', description: 'USB-C hub: 4K HDMI, 100W PD, 4xUSB-A, SD/MicroSD, Ethernet, 3.5mm audio.', featured: true, tag: 'Best Hub' },
  { id: 20, name: 'MechKey TKL Keyboard', category: 'laptop-accessories', price: 129, originalPrice: 179, rating: 4.7, reviews: 298, stock: 65, image: '/keyboard.jpg', description: 'Tenkeyless mechanical keyboard, Cherry MX switches, RGB backlit, aluminium frame.', featured: false, tag: 'Mechanical' },
  { id: 21, name: 'ErgoGlide Pro Mouse', category: 'laptop-accessories', price: 69, originalPrice: 99, rating: 4.6, reviews: 421, stock: 130, image: '/mouse.jpg', description: 'Ergonomic wireless mouse, 4000 DPI, silent clicks, 90-day battery, multi-device.', featured: false, tag: 'Ergonomic' },
  { id: 22, name: 'LapStand Aluminium Pro', category: 'laptop-accessories', price: 55, originalPrice: 79, rating: 4.7, reviews: 356, stock: 88, image: '/hub.jpg', description: 'Adjustable aluminium laptop stand, 15° to 50° tilt, fits 10-17" laptops, foldable.', featured: false, tag: 'Adjustable' },
  { id: 23, name: 'CoolPad Dual Fan X5', category: 'laptop-accessories', price: 39, originalPrice: 55, rating: 4.4, reviews: 213, stock: 75, image: '/fan.jpg', description: 'Dual 140mm fans, adjustable height, USB-powered, ultra-quiet <25dB operation.', featured: false, tag: 'Cooling' },
  { id: 24, name: 'PrivacyGuard Filter 15"', category: 'laptop-accessories', price: 49, originalPrice: 69, rating: 4.3, reviews: 167, stock: 60, image: '/monitor.jpg', description: '15.6" laptop privacy screen filter, blocks 60° side view, anti-glare coating.', featured: false, tag: 'Privacy' },
  { id: 25, name: 'LapBag Pro Backpack', category: 'laptop-accessories', price: 79, originalPrice: 109, rating: 4.8, reviews: 534, stock: 95, image: '/hub.jpg', description: '30L waterproof backpack, fits 17" laptop, USB charging port, anti-theft zipper.', featured: true, tag: 'Waterproof' },
  { id: 26, name: 'WristRest Gel Pad Set', category: 'laptop-accessories', price: 22, originalPrice: 34, rating: 4.5, reviews: 289, stock: 200, image: '/mouse.jpg', description: 'Memory foam wrist rest set for keyboard + mouse, non-slip base, soft fabric cover.', featured: false, tag: 'Comfort' },
  { id: 27, name: 'PortableMonitor 15.6"', category: 'laptop-accessories', price: 199, originalPrice: 269, rating: 4.7, reviews: 143, stock: 30, image: '/monitor.jpg', description: '15.6" 1080p portable monitor, USB-C + mini HDMI, 60Hz, 300 nit, with case.', featured: false, tag: 'Portable' },
  { id: 28, name: 'CleanKit Pro 7-in-1', category: 'laptop-accessories', price: 18, originalPrice: 28, rating: 4.4, reviews: 678, stock: 400, image: '/keyboard.jpg', description: 'Laptop cleaning kit: microfiber cloth, screen spray, air blower, brushes, keyboard cover.', featured: false, tag: 'Essential' },

  // Electrical Appliances (6)
  { id: 29, name: 'SmartPlug 4-Port Tower', category: 'electrical', price: 45, originalPrice: 65, rating: 4.6, reviews: 387, stock: 120, image: '/speaker.jpg', description: '4 AC outlets + 4 USB ports, surge protection, individual switches, 2500W capacity.', featured: false, tag: 'Surge Guard' },
  { id: 30, name: 'BrightLight LED Strip Kit', category: 'electrical', price: 35, originalPrice: 55, rating: 4.5, reviews: 512, stock: 200, image: '/speaker.jpg', description: '5m RGB LED strip, app control, music sync, 16M colors, self-adhesive backing.', featured: false, tag: 'RGB' },
  { id: 31, name: 'DeskFan Quiet 12"', category: 'electrical', price: 55, originalPrice: 79, rating: 4.4, reviews: 234, stock: 70, image: '/fan.jpg', description: '3-speed settings, 50dB ultra-quiet, 12" blade, 8hr timer, USB powered option.', featured: false, tag: 'Quiet' },
  { id: 32, name: 'UPS Guardian 1000VA', category: 'electrical', price: 149, originalPrice: 199, rating: 4.7, reviews: 156, stock: 35, image: '/speaker.jpg', description: '1000VA/600W UPS, 6 outlets, AVR, LCD display, protects against power outages.', featured: false, tag: 'Power Guard' },
  { id: 33, name: 'AirPurifier Mini Desk', category: 'electrical', price: 89, originalPrice: 119, rating: 4.5, reviews: 198, stock: 50, image: '/fan.jpg', description: 'HEPA + activated carbon filter, 3 speeds, night mode, 99.97% particle removal.', featured: false, tag: 'HEPA' },
  { id: 34, name: 'WirelessCharger Station 3-in-1', category: 'electrical', price: 69, originalPrice: 99, rating: 4.6, reviews: 301, stock: 80, image: '/charger.jpg', description: 'Charges phone + earbuds + watch simultaneously, 15W max, slim design, LED indicator.', featured: false, tag: '3-in-1' },
];

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  // Restore user from secure session token; restore page from sessionStorage
  const [user, setUserState] = useState(() => resolveSessionToken());
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(() => sessionGet('brightcart_page', 'home'));
  const [pageParams, setPageParams] = useState(() => sessionGet('brightcart_page_params', {}));

  // Keep page routing in sessionStorage
  useEffect(() => { sessionSet('brightcart_page', page); }, [page]);
  useEffect(() => { sessionSet('brightcart_page_params', pageParams); }, [pageParams]);

  // Internal setter — always syncs to session token
  const setUser = useCallback((u) => {
    if (u) createSessionToken(u);
    setUserState(u);
  }, []);

  // Start idle watchdog when an admin logs in; stop it on logout
  useEffect(() => {
    if (user && ['super_admin', 'admin', 'moderator'].includes(user.role)) {
      startIdleWatchdog(() => {
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

  const placeOrder = useCallback((orderData) => {
    const newOrder = {
      id: `ORD-${Date.now()}`,
      ...sanitizeObject(orderData),
      items: [...cart],
      total: cart.reduce((sum, item) => sum + item.product.price * item.qty, 0),
      status: 'Pending',
      date: new Date().toLocaleDateString(),
      customer: user?.name || orderData.name,
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    return newOrder;
  }, [cart, user]);

  // ── Admin team management — passwords stored as SHA-256 hashes ───────────────
  const [adminUsers, setAdminUsers] = useState([
    {
      id: 'sa-1',
      name: 'Super Admin',
      email: 'boafokyei3@gmail.com',
      passwordHash: SUPER_ADMIN_HASH,   // SHA-256('Ky2004ei-' + SALT) — never plaintext
      role: 'super_admin',
      createdAt: 'Jan 1, 2026',
      lastLogin: 'Nov 1, 2026',
      status: 'Active',
    },
  ]);

  const login = useCallback((userData) => {
    setUser(userData);
  }, [setUser]);

  // Async: hashes the input password then compares against stored hash
  const adminLogin = useCallback(async (email, password) => {
    // Rate-limit check first
    const lock = isLockedOut();
    if (lock.locked) return { success: false, locked: true, secondsLeft: lock.secondsLeft };

    const inputHash = await hashPassword(password);
    const found = adminUsers.find(
      (a) => a.email === email && a.passwordHash === inputHash && a.status === 'Active'
    );

    if (found) {
      recordSuccessfulLogin();
      const userData = { name: found.name, email: found.email, role: found.role, adminId: found.id };
      setUser(userData);
      return { success: true };
    }

    const result = recordFailedAttempt();
    return { success: false, ...result };
  }, [adminUsers, setUser]);

  const addAdminUser = useCallback(async (userData) => {
    const passwordHash = await hashPassword(userData.password);
    const safe = sanitizeObject({ ...userData, password: undefined });
    const newAdmin = {
      ...safe,
      passwordHash,
      id: `admin-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastLogin: 'Never',
      status: 'Active',
    };
    setAdminUsers((prev) => [...prev, newAdmin]);
  }, []);

  const removeAdminUser = useCallback((id) => {
    setAdminUsers((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const changeAdminPassword = useCallback(async (id, newPassword) => {
    const passwordHash = await hashPassword(newPassword);
    setAdminUsers((prev) =>
      prev.map((a) => (a.id === id ? { ...a, passwordHash } : a))
    );
  }, []);

  const toggleAdminStatus = useCallback((id) => {
    setAdminUsers((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: a.status === 'Active' ? 'Disabled' : 'Active' } : a))
    );
  }, []);

  const logout = useCallback(() => {
    destroySessionToken();
    sessionStorage.removeItem('brightcart_page');
    sessionStorage.removeItem('brightcart_page_params');
    setUserState(null);
    setPage('home');
  }, []);

  // ── Admin: product CRUD (inputs sanitised) ───────────────────────────────────
  const addProduct = useCallback((data) => {
    const newProd = { ...sanitizeObject(data), id: `prod-${Date.now()}` };
    setProducts(prev => [newProd, ...prev]);
  }, []);

  const updateProduct = useCallback((updated) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...sanitizeObject(updated) } : p));
  }, []);

  const deleteProduct = useCallback((id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  return (
    <StoreContext.Provider value={{
      products,
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
      logout,
      adminLogin,
      addProduct,
      updateProduct,
      deleteProduct,
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
