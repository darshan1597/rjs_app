import { api, apiAssetUrl } from './api.js';

export const formatPackagePrice = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(Number(value) || 0);

export const packageImageUrl = (value) => value ? apiAssetUrl(value) : '/assets/rjs-logo.png';

export async function fetchTourPackages(options = {}) {
  const query = new URLSearchParams({ limit: String(options.limit || 100) });
  if (options.search) query.set('search', options.search);
  if (options.featured !== undefined) query.set('featured', String(options.featured));
  return api(`/api/v1/tour-packages?${query}`);
}

export async function fetchTourPackage(slug) {
  const data = await api(`/api/v1/tour-packages/${encodeURIComponent(slug)}`);
  return data.package;
}
