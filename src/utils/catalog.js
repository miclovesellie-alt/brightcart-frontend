const LEGACY_SAMPLE_PRODUCT_IDS = new Set(
  Array.from({ length: 34 }, (_, index) => index + 1),
);

export function isSampleProduct(product) {
  const id = Number(product?.id);
  return product?.isSample === true
    || (LEGACY_SAMPLE_PRODUCT_IDS.has(id) && product?.isSample !== false);
}

export function isStorefrontProduct(product) {
  return Boolean(product)
    && !isSampleProduct(product)
    && product.status !== 'Draft'
    && product.status !== 'Out of Stock';
}

export function getStorefrontProducts(products) {
  return Array.isArray(products) ? products.filter(isStorefrontProduct) : [];
}

export function formatCategory(category = '') {
  return String(category)
    .split('-')
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
