const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  async getProducts() {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('API error, falling back to local state:', err.message);
      return null;
    }
  },

  async addProduct(product) {
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error('Failed to create product');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('API error creating product:', err.message);
      return null;
    }
  },

  async getOrders() {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('API error fetching orders:', err.message);
      return null;
    }
  },

  async placeOrder(order) {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error('Failed to submit order');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('API error placing order:', err.message);
      return null;
    }
  },

  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
