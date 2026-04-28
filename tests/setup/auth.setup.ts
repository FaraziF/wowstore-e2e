// tests/setup/auth.setup.ts
// Runs once before all other tests. Saves authenticated browser state so
// every subsequent test skips the login page.
//
// URL source: baseURL is read from WP_BASE_URL in .env via playwright.config.ts.
// All navigation uses relative paths — no hardcoded hostnames here.

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_DIR        = path.join(process.cwd(), 'playwright/.auth');
const ADMIN_AUTH_FILE = path.join(AUTH_DIR, 'admin.json');

setup.beforeAll(() => {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
});

setup('authenticate as admin', async ({ page }) => {
  // Credentials from .env — never hardcode these in spec files.
  const user     = process.env.WP_ADMIN_USER     ?? 'admin';
  const password = process.env.WP_ADMIN_PASSWORD ?? 'password';

  // baseURL (set from WP_BASE_URL in .env) is resolved automatically by Playwright.
  await page.goto('/wp-login.php');

  await page.fill('#user_login', user);
  await page.fill('#user_pass',  password);
  await page.click('#wp-submit');

  // Verify we reached the admin dashboard
  await page.waitForURL(/wp-admin/, { timeout: 20_000 });
  await expect(page.locator('#wpadminbar')).toBeVisible();

  // Persist cookies + localStorage so subsequent tests skip login
  await page.context().storageState({ path: ADMIN_AUTH_FILE });

  console.log('✅  Admin auth state saved to', ADMIN_AUTH_FILE);
});
