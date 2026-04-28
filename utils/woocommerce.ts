// utils/woocommerce.ts
// Helpers that interact with WooCommerce data via the REST API,
// keeping test setup/teardown fast and UI-independent.

import type { APIRequestContext } from '@playwright/test';

// ── WC API response shapes ───────────────────────────────────────────────────

export interface WcProduct {
  id: number;
  name: string;
  permalink: string;
  status: string;
  [key: string]: unknown;
}

export interface WcCategory {
  id: number;
  name: string;
  slug: string;
  [key: string]: unknown;
}

export interface WcProductOverrides {
  name?: string;
  type?: string;
  regular_price?: string;
  status?: string;
  description?: string;
  short_description?: string;
  manage_stock?: boolean;
  stock_quantity?: number;
  categories?: Array<{ id: number }>;
  [key: string]: unknown;
}

// ── Nonce caching ─────────────────────────────────────────────────────────────

let _cachedNonce: string | null = null;

/**
 * Fetch the WP REST API nonce from a WordPress admin page.
 * The `request` context already carries cookies from the Playwright
 * storageState (admin.json), so we just need the nonce for cookie-based auth.
 */
async function getRestNonce(request: APIRequestContext): Promise<string> {
  if (_cachedNonce) return _cachedNonce;

  const res = await request.get('/wp-admin/admin-ajax.php', {
    params: { action: 'rest-nonce' },
  });
  const nonce = (await res.text()).trim();

  if (!nonce || nonce === '0' || nonce === '-1') {
    // Fallback: scrape the nonce from an admin page
    const pageRes = await request.get('/wp-admin/');
    const html = await pageRes.text();
    const match = html.match(/wpApiSettings[^}]*"nonce"\s*:\s*"([a-f0-9]+)"/);
    if (match) {
      _cachedNonce = match[1];
      return _cachedNonce;
    }
    throw new Error(
      'Could not obtain WP REST nonce. Make sure the Playwright auth setup has run ' +
      'and the admin storageState includes valid cookies.'
    );
  }

  _cachedNonce = nonce;
  return _cachedNonce;
}

/**
 * Reset the cached nonce (useful between test runs).
 */
export function resetNonceCache(): void {
  _cachedNonce = null;
}

/**
 * Create a simple WooCommerce product via the REST API.
 * @param request  Playwright API request context
 * @param overrides  Partial WC product fields
 */
export async function createProduct(
  request: APIRequestContext,
  overrides: WcProductOverrides = {}
): Promise<WcProduct> {
  const nonce = await getRestNonce(request);
  const response = await request.post('/wp-json/wc/v3/products', {
    headers: { 'X-WP-Nonce': nonce },
    data: {
      name:          overrides.name          ?? 'Test Product – WowStore E2E',
      type:          overrides.type          ?? 'simple',
      regular_price: overrides.regular_price ?? '29.99',
      status:        overrides.status        ?? 'publish',
      description:   overrides.description   ?? 'Automated test product.',
      short_description: overrides.short_description ?? 'Short description.',
      manage_stock:  overrides.manage_stock  ?? true,
      stock_quantity:overrides.stock_quantity ?? 100,
      categories:    overrides.categories    ?? [],
      ...overrides,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create product: ${await response.text()}`);
  }
  return response.json() as Promise<WcProduct>;
}

/**
 * Create a WooCommerce product category via the REST API.
 * @param request  Playwright API request context
 * @param name  Category name
 */
export async function createCategory(
  request: APIRequestContext,
  name: string
): Promise<WcCategory> {
  const nonce = await getRestNonce(request);
  const response = await request.post('/wp-json/wc/v3/products/categories', {
    headers: { 'X-WP-Nonce': nonce },
    data: { name },
  });
  return response.json() as Promise<WcCategory>;
}

/**
 * Delete a WooCommerce product by ID.
 * @param request  Playwright API request context
 * @param productId  Product ID to delete
 */
export async function deleteProduct(
  request: APIRequestContext,
  productId: number
): Promise<void> {
  const nonce = await getRestNonce(request);
  await request.delete(`/wp-json/wc/v3/products/${productId}`, {
    headers: { 'X-WP-Nonce': nonce },
    params: { force: true },
  });
}

/**
 * Delete a WooCommerce category by ID.
 * @param request  Playwright API request context
 * @param categoryId  Category ID to delete
 */
export async function deleteCategory(
  request: APIRequestContext,
  categoryId: number
): Promise<void> {
  const nonce = await getRestNonce(request);
  await request.delete(`/wp-json/wc/v3/products/categories/${categoryId}`, {
    headers: { 'X-WP-Nonce': nonce },
    params: { force: true },
  });
}

/**
 * Get the WooCommerce shop page URL.
 * @param request  Playwright API request context
 */
export async function getShopUrl(request: APIRequestContext): Promise<string> {
  const nonce = await getRestNonce(request);
  const res  = await request.get('/wp-json/wc/v3/settings/general/woocommerce_shop_page_id', {
    headers: { 'X-WP-Nonce': nonce },
  });
  const data = await res.json() as { value: string };
  const pageRes = await request.get(`/wp-json/wp/v2/pages/${data.value}`, {
    headers: { 'X-WP-Nonce': nonce },
  });
  const pageData = await pageRes.json() as { link?: string };
  if (!pageData.link) {
    throw new Error(`WP REST API did not return a link for shop page (id=${data.value}). Falling back to /shop.`);
  }
  return pageData.link;
}
