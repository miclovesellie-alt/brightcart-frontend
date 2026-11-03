const IMAGE_SOURCE_PATTERN = /^(https?:\/\/|\/|data:image\/)/i;

export function getProductImages(product) {
  if (!product) return [];
  const candidates = [
    ...(Array.isArray(product.images) ? product.images : []),
    product.image,
  ];
  return [...new Set(candidates
    .filter(value => typeof value === 'string')
    .map(value => value.trim())
    .filter(value => IMAGE_SOURCE_PATTERN.test(value)))];
}

export function categorySlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function categoryLabel(value) {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}
