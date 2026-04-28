// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // WordPress state is shared; keep sequential
  forbidOnly: !!process.env.CI,
  // retries: process.env.CI ? 1 : 1,
  workers: 1, // Single worker — avoids WP race conditions
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.WP_BASE_URL || 'http://localhost:8888',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // Exclude helper/POM directories from test discovery.
  // pom/ and wp/ contain shared utilities, not test specs.
  testIgnore: ['**/pom/**', '**/wp/**', '**/scenarios/**'],

  projects: [
    // ── 1. Auth setup (always runs first) ──────────────────────────────────
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // ── 2. Admin-UI tests (Chrome + admin auth)
    //    Covers: Gutenberg block editor, plugin lifecycle, error-handling, security.
    //    testMatch is explicit so addon/store-builder/frontend are NOT picked up here.
    {
      name: 'chromium-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
        viewport: { width: 1280, height: 720 },
        launchOptions: { slowMo: 1000 },
      },
      dependencies: ['setup'],
      testMatch: [
        '**/plugin/**',
        '**/blocks/product-grid.spec.ts',
        '**/blocks/product-category.spec.ts',
        '**/error-handling/**',
        '**/security/**',
        '**/wp/**',
      ],
    },

    // ── 3. Shopper / frontend tests (Chrome + admin auth for API)
    //    Why admin auth here? beforeAll uses WC REST API to create test data.
    //    The page itself navigates to frontend URLs — admin can visit frontend
    //    pages identically to a customer for assertion purposes.
    //    Covers: frontend/, addons/, store-builder/, blocks/product-filter.spec.ts
    {
      name: 'chromium-shopper',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
      testMatch: [
        '**/frontend/**',
        '**/addons/**',
        '**/store-builder/**',
        '**/blocks/product-filter.spec.ts',
        '**/blocks/product-slider.spec.ts',
        '**/blocks/product-grid-pagination.spec.ts',
        '**/blocks/banner-maker.spec.ts',
      ],
    },

    // ── 4. Cross-browser smoke (Firefox) — admin-UI @smoke only
    //    Restricted to admin-UI test dirs to avoid running shopper tests
    //    in a context that was not designed for them.
    {
      name: 'firefox-smoke',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/admin.json',
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
      grep: /@smoke/,
      testMatch: [
        '**/plugin/**',
        '**/blocks/product-grid.spec.ts',
        '**/blocks/product-category.spec.ts',
        '**/error-handling/**',
        '**/security/**',
        '**/wp/**',
      ],
    },
  ],
});
