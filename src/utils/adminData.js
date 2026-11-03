const CLOSED_STATUSES = new Set(['cancelled', 'canceled', 'refunded']);

export function getOrderDate(order) {
  const value = order?.createdAt || order?.date;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getOrderAmount(order) {
  const amount = Number(order?.total);
  return Number.isFinite(amount) ? amount : 0;
}

export function isPaidOrder(order) {
  return order?.paymentStatus === 'paid' && !CLOSED_STATUSES.has(String(order?.status || '').toLowerCase());
}

export function getCustomerKey(order) {
  const email = String(order?.email || '').trim().toLowerCase();
  if (email) return `email:${email}`;
  const name = String(order?.customer || '').trim().toLowerCase();
  return name ? `name:${name}` : `order:${order?.id || order?.createdAt || order?.date || 'unknown'}`;
}

export function getUniqueCustomerCount(orders = []) {
  return new Set(orders.map(getCustomerKey)).size;
}

export function aggregateCustomers(orders = []) {
  const customers = new Map();
  orders.forEach(order => {
    const key = getCustomerKey(order);
    let customer = customers.get(key);
    const date = getOrderDate(order);
    if (!customer) {
      customer = {
        id: key,
        name: String(order.customer || 'Customer').trim(),
        email: String(order.email || '').trim(),
        phone: String(order.phone || '').trim(),
        country: String(order.country || '').trim(),
        orders: [],
        paidSpend: 0,
        firstOrderDate: date,
        lastOrderDate: date,
      };
      customers.set(key, customer);
    }
    customer.orders.push(order);
    if (!customer.email && order.email) customer.email = String(order.email).trim();
    if (!customer.phone && order.phone) customer.phone = String(order.phone).trim();
    if (!customer.country && order.country) customer.country = String(order.country).trim();
    if (date && (!customer.firstOrderDate || date < customer.firstOrderDate)) customer.firstOrderDate = date;
    if (date && (!customer.lastOrderDate || date > customer.lastOrderDate)) customer.lastOrderDate = date;
    if (isPaidOrder(order)) customer.paidSpend += getOrderAmount(order);
  });
  return [...customers.values()];
}
