// tests/setup/customer-auth.setup.ts
// Saves authenticated browser state for a WooCommerce customer role user.
// Used by security tests that verify privilege escalation boundaries.
//
// URL source: baseURL is read from WP_BASE_URL in .env via playwright.config.ts.

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs   from 'fs';

const AUTH_DIR            = path.join(process.cwd(), 'playwright/.auth');
const CUSTOMER_AUTH_FILE  = path.join(AUTH_DIR, 'customer.json');

setup.beforeAll(() => {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
});

setup('authenticate as customer', async ({ page }) => {
  // Customer credentials from .env — WC_CUSTOMER_USER / WC_CUSTOMER_PASSWORD
  const user     = process.env.WC_CUSTOMER_USER     ?? 'customer1';
  const password = process.env.WC_CUSTOMER_PASSWORD ?? 'password';

  // baseURL resolved from WP_BASE_URL in .env via playwright.config.ts
  await page.goto('/wp-login.php');

  await page.fill('#user_login', user);
  await page.fill('#user_pass',  password);
  await page.click('#wp-submit');

  // Customer lands on /my-account or /wp-admin (redirected) — either is fine
  await page.waitForLoadState('networkidle', { timeout: 20_000 });

  // Verify login succeeded by checking the user bar or my-account page
  const loggedIn = await page
    .locator('#wpadminbar, .woocommerce-MyAccount-navigation, .woocommerce-account')
    .first()
    .isVisible({ timeout: 10_000 })
    .catch(() => false);

  if (!loggedIn) {
    throw new Error(
      'Customer login failed. Check WC_CUSTOMER_USER / WC_CUSTOMER_PASSWORD in .env'
    );
  }

  await page.context().storageState({ path: CUSTOMER_AUTH_FILE });
  console.log('✅  Customer auth state saved to', CUSTOMER_AUTH_FILE);
});
