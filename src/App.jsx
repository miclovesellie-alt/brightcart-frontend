import { StoreProvider, useStore } from './context/StoreContext';
import { CurrencyProvider } from './context/CurrencyContext';
import SmoothScroll from './components/SmoothScroll';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountPage from './pages/AccountPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSuppliers from './pages/admin/AdminSuppliers';
import AdminUsers from './pages/admin/AdminUsers';
import AIDropshipping from './pages/admin/AIDropshipping';

const ADMIN_PAGES = ['admin', 'admin-dashboard', 'admin-products', 'admin-orders', 'admin-customers', 'admin-analytics', 'admin-settings', 'admin-suppliers', 'admin-users', 'admin-dropshipping'];

const ADMIN_ROLES = ['super_admin', 'admin', 'moderator'];
const PAGE_ROLES = {
  'admin-products': ['super_admin', 'admin'],
  'admin-analytics': ['super_admin', 'admin'],
  'admin-settings': ['super_admin'],
  'admin-suppliers': ['super_admin'],
  'admin-users': ['super_admin'],
  'admin-dropshipping': ['super_admin', 'admin'],
};

function AppContent() {
  const { page, pageParams, user, navigate } = useStore();

  const isAdmin = ADMIN_PAGES.includes(page);

  // Guard: block admin pages unless logged in as admin
  if (isAdmin) {
    if (!user || !ADMIN_ROLES.includes(user.role)) {
      // Not authenticated as admin — bounce to account/login
      setTimeout(() => navigate('account'), 0);
      return null;
    }
    const allowedRoles = PAGE_ROLES[page];
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      setTimeout(() => navigate('admin-dashboard'), 0);
      return null;
    }
    const activePage = page === 'admin' ? 'admin-dashboard' : page;

    const renderAdminPage = () => {
      switch (activePage) {
        case 'admin-dashboard': return <AdminDashboard />;
        case 'admin-products': return <AdminProducts />;
        case 'admin-orders': return <AdminOrders />;
        case 'admin-customers': return <AdminCustomers />;
        case 'admin-analytics': return <AdminAnalytics />;
        case 'admin-settings': return <AdminSettings />;
        case 'admin-suppliers': return <AdminSuppliers />;
        case 'admin-users': return <AdminUsers />;
        case 'admin-dropshipping': return <AIDropshipping />;
        default: return <AdminDashboard />;
      }
    };

    return (
      <AdminLayout key={`${activePage}:${JSON.stringify(pageParams || {})}`} activePage={activePage}>
        {renderAdminPage()}
      </AdminLayout>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage />;
      case 'products': return <ProductsPage />;
      case 'product-detail': return <ProductDetailPage />;
      case 'cart': return <CartPage />;
      case 'checkout': return <CheckoutPage />;
      case 'account': return <AccountPage />;
      default: return <HomePage />;
    }
  };

  return (
    <SmoothScroll>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0f' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          {renderPage()}
        </main>
        {page === 'home' && <Footer />}
      </div>
    </SmoothScroll>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <CurrencyProvider>
        <AppContent />
      </CurrencyProvider>
    </StoreProvider>
  );
}
