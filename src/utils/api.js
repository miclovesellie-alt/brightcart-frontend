import { getSessionToken, destroySessionToken } from './security';

const API_BASE = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '')).replace(/\/$/, '');

async function request(path, options = {}) {
  if (!API_BASE) {
    throw new Error('Shoppercart API is not configured. Set VITE_API_URL to the deployed backend API URL.');
  }
  const { auth = true, ...init } = options;
  const headers = new Headers(init.headers || {});
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const token = auth ? getSessionToken() : null;
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch (error) {
    throw new Error(`Cannot reach the Shoppercart API. Check VITE_API_URL and the backend status. ${error.message}`);
  }

  let payload = {};
  try { payload = await response.json(); }
  catch { payload = {}; }
  if (!response.ok || payload.success === false) {
    if (response.status === 401) destroySessionToken();
    const error = new Error(payload.error || `Request failed (${response.status}).`);
    error.status = response.status;
    error.details = payload;
    throw error;
  }
  return payload;
}

const body = value => JSON.stringify(value);

export const api = {
  async login(email, password) {
    return request('/auth/login', { method: 'POST', auth: false, body: body({ email, password }) });
  },
  async register(user) {
    return request('/auth/register', { method: 'POST', auth: false, body: body(user) });
  },
  async getMe() { return request('/auth/me'); },

  async getProducts() { return request('/products', { auth: false }); },
  async getAdminProducts() { return request('/admin/products'); },
  async addProduct(product) { return request('/admin/products', { method: 'POST', body: body(product) }); },
  async updateProduct(product) { return request(`/admin/products/${encodeURIComponent(product.id)}`, { method: 'PATCH', body: body(product) }); },
  async deleteProduct(id) { return request(`/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' }); },

  async getAdminOrders() { return request('/admin/orders'); },
  async getOrders() { return request('/admin/orders'); },
  async getAccountOrders() { return request('/account/orders'); },
  async placeOrder(order) { return request('/orders', { method: 'POST', body: body(order) }); },
  async updateOrder(id, patch) { return request(`/admin/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: body(patch) }); },

  async getAdminUsers() { return request('/admin/users'); },
  async addAdminUser(user) { return request('/admin/users', { method: 'POST', body: body(user) }); },
  async updateAdminUser(id, patch) { return request(`/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: body(patch) }); },
  async removeAdminUser(id) { return request(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' }); },

  async getDropshipOverview(days = 30) { return request(`/dropship/overview?days=${encodeURIComponent(days)}`); },
  async getDropshipConnections() { return request('/dropship/connections'); },
  async getResearch() { return request('/dropship/research'); },
  async createResearch(candidate) { return request('/dropship/research', { method: 'POST', body: body(candidate) }); },
  async generateProductContent(id) { return request(`/dropship/research/${encodeURIComponent(id)}/generate-content`, { method: 'POST', body: body({}) }); },
  async importResearch(id, updateExisting = false) { return request(`/dropship/research/${encodeURIComponent(id)}/import`, { method: 'POST', body: body({ updateExisting }) }); },
  async publishDraft(id, checks) { return request(`/dropship/products/${encodeURIComponent(id)}/publish`, { method: 'POST', body: body(checks) }); },
  async getSupplierPurchases() { return request('/dropship/purchases'); },
  async recordSupplierPurchase(orderId, purchase) { return request(`/dropship/orders/${encodeURIComponent(orderId)}/purchases`, { method: 'POST', body: body(purchase) }); },
  async confirmPayment(orderId, confirmation) { return request(`/dropship/orders/${encodeURIComponent(orderId)}/confirm-payment`, { method: 'POST', body: body(confirmation) }); },
};
