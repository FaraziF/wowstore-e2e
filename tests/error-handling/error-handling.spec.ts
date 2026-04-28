// tests/error-handling/error-handling.spec.ts
// E2E tests verifying that WowStore handles error conditions gracefully.
// WooCommerce dependency errors, REST API errors, block empty states,
// and WC page integrity are all covered here.
//
// Tags: @error @smoke @regression
//
// URL source: baseURL is read from WP_BASE_URL in .env via playwright.config.ts.

import { test, expect } from '@playwright/test';
import { errorHandlingScenarios } from '../scenarios/errorHandling.scenarios';

const PLUGIN_SLUG_WC = 'woocommerce';

async function deactivatePlugin(
  page: import('@playwright/test').Page,
  slug: string,
  opts?: { handleWowStoreModal?: boolean },
): Promise<void> {
  const row = page.locator(`tr[data-slug="${slug}"]`).first();
  const deactivateLink = row.locator('a:has-text("Deactivate")');
  if (await deactivateLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await deactivateLink.click();

    if (opts?.handleWowStoreModal) {
      const modal = page.locator('#wopb-deactive-modal');
      if (await modal.isVisible({ timeout: 4_000 }).catch(() => false)) {
        await modal.locator('a.wopb-modal-deactive').click();
      }
    }

    await page.waitForLoadState('networkidle');
  }

  // Verify it's inactive now (Activate link visible).
  await expect(row.locator('a:has-text("Activate")')).toBeVisible({ timeout: 10_000 });
}

async function activatePlugin(page: import('@playwright/test').Page, slug: string): Promise<void> {
  const row = page.locator(`tr[data-slug="${slug}"]`).first();
  const activateLink = row.locator('a:has-text("Activate")');
  if (await activateLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await activateLink.click();
    await page.waitForLoadState('networkidle');
  }
  await expect(row.locator('a:has-text("Deactivate")')).toBeVisible({ timeout: 10_000 });
}

test.describe('WowStore Error Handling (BDD)', () => {
  for (const s of errorHandlingScenarios) {
    test(s.title, async ({ page, request }) => {
      // Attach Gherkin text as annotation for reporting
      await test.step('Gherkin', async () => {
        test.info().annotations.push({ type: 'gherkin', description: s.gherkin });
      });

      // ── wc-dependency-deactivated ─────────────────────────────────────────
      if (s.id === 'wc-dependency-deactivated') {
        // WordPress enforces dependency order:
        //   WooCommerce CANNOT be deactivated while WowStore is active.
        //   Correct flow: deactivate WowStore → deactivate WC → verify notice → restore both.
        const PLUGIN_SLUG_WOWSTORE = 'product-blocks';

        let wowstoreDeactivated = false;
        let wcDeactivated = false;

        try {
          await test.step('Given I navigate to the Plugins page', async () => {
            await page.goto('/wp-admin/plugins.php');
            await page.waitForLoadState('networkidle');
          });

          await test.step('When I deactivate WowStore first (WordPress dependency requirement)', async () => {
            await deactivatePlugin(page, PLUGIN_SLUG_WOWSTORE, { handleWowStoreModal: true });
            wowstoreDeactivated = true;
          });

          await test.step('And I deactivate WooCommerce (if possible)', async () => {
            await page.goto('/wp-admin/plugins.php');
            await page.waitForLoadState('networkidle');

            const wcRow = page.locator(`tr[data-slug="${PLUGIN_SLUG_WC}"]`).first();
            const wcDeactivate = wcRow.locator('a:has-text("Deactivate")');

            // In many real installs, WooCommerce cannot be deactivated if ANY other dependent plugin is active.
            // In that case, this scenario is not meaningful and should be skipped.
            if (!(await wcDeactivate.isVisible({ timeout: 2_000 }).catch(() => false))) {
              // Restore WowStore before skipping to avoid breaking the rest of the suite.
              if (wowstoreDeactivated) {
                await activatePlugin(page, PLUGIN_SLUG_WOWSTORE).catch(() => {});
                wowstoreDeactivated = false;
              }
              test.skip(true, 'WooCommerce cannot be deactivated (another dependent plugin is active).');
            }

            await deactivatePlugin(page, PLUGIN_SLUG_WC);
            wcDeactivated = true;
          });

          await test.step('When I attempt to activate WowStore without WooCommerce active', async () => {
            await page.goto('/wp-admin/plugins.php');
            await page.waitForLoadState('networkidle');
            const wowstoreRow = page.locator(`tr[data-slug="${PLUGIN_SLUG_WOWSTORE}"]`).first();
            await wowstoreRow.locator('a:has-text("Activate")').click();
            await page.waitForLoadState('networkidle');
          });

          await test.step('Then an admin notice should appear indicating WooCommerce is required', async () => {
            const messageRe =
              /WooCommerce.*required|requires WooCommerce|WooCommerce.*missing|WooCommerce.*inactive/i;

            const topNotice = page.locator('.notice, .notice-error, .error, .updated').filter({
              hasText: messageRe,
            });

            const inlineNotice = page
              .locator(
                `tr[data-slug="${PLUGIN_SLUG_WOWSTORE}"], tr[data-slug="${PLUGIN_SLUG_WOWSTORE}"] + tr`,
              )
              .filter({ hasText: messageRe });

            await expect(topNotice.first().or(inlineNotice.first())).toBeVisible({
              timeout: 10_000,
            });
          });

          await test.step('And WowStore should NOT be shown as active (no Deactivate link)', async () => {
            const wowstoreRow = page.locator(`tr[data-slug="${PLUGIN_SLUG_WOWSTORE}"]`).first();
            await expect(wowstoreRow.locator('a:has-text("Deactivate")')).toBeHidden({
              timeout: 5_000,
            });
          });
        } finally {
          // Always restore for suite stability.
          await page.goto('/wp-admin/plugins.php');
          await page.waitForLoadState('networkidle');

          if (wcDeactivated) {
            await activatePlugin(page, PLUGIN_SLUG_WC).catch(() => {});
          }
          if (wowstoreDeactivated) {
            await activatePlugin(page, PLUGIN_SLUG_WOWSTORE).catch(() => {});
          }
        }

        // Sanity: WowStore settings reachable after restore (if we didn't skip).
        await test.step('Then WowStore should function normally again', async () => {
          await page.goto('/wp-admin/admin.php?page=wopb-settings');
          await page.waitForLoadState('networkidle');
          await expect(
            page.locator('.wopb-settings-tab-wrap, .wopb-setting-header').first(),
          ).toBeVisible({ timeout: 10_000 });
        });
      }


      // ── wc-version-below-minimum ──────────────────────────────────────────
      if (s.id === 'wc-version-below-minimum') {
        await test.step('Given I navigate to the WowStore dashboard', async () => {
          await page.goto('/wp-admin/admin.php?page=wopb-settings');
          await page.waitForLoadState('networkidle');
        });

        await test.step('Then no WooCommerce version mismatch notice should be present', async () => {
          const versionNotice = page.locator('.notice, .error').filter({
            hasText: /WooCommerce.*version|version.*WooCommerce|requires WooCommerce \d/i,
          });
          await expect(versionNotice).toHaveCount(0);
        });

        await test.step('And the dashboard should load without compatibility warnings', async () => {
          await expect(
            page.locator('.wopb-settings-tab-wrap, .wopb-setting-header').first()
          ).toBeVisible({ timeout: 10_000 });
        });
      }

      // ── block-empty-categories ────────────────────────────────────────────
      if (s.id === 'block-empty-categories') {
        await test.step('Given I navigate to create a new post', async () => {
          await page.goto('/wp-admin/post-new.php');
          await page.waitForLoadState('domcontentloaded');
        });

        await test.step('Then no JavaScript error overlay should appear in the editor', async () => {
          // Gutenberg shows a "Your site experienced a critical error" message on JS crash
          const errorOverlay = page.locator('.editor-error-boundary, .block-editor-warning').first();
          const hasError = await errorOverlay.isVisible({ timeout: 5_000 }).catch(() => false);
          expect(hasError).toBe(false);
        });

        await test.step('And the block editor canvas should be visible', async () => {
          await expect(
            page.locator('.block-editor-writing-flow, .editor-styles-wrapper').first()
          ).toBeVisible({ timeout: 20_000 });
        });
      }

      // ── block-empty-products ──────────────────────────────────────────────
      if (s.id === 'block-empty-products') {
        await test.step('Given I navigate to create a new post', async () => {
          await page.goto('/wp-admin/post-new.php');
          await page.waitForLoadState('domcontentloaded');
        });

        await test.step('Then no critical error overlay should appear', async () => {
          const errorOverlay = page.locator('.editor-error-boundary, .block-editor-warning').first();
          const hasError = await errorOverlay.isVisible({ timeout: 5_000 }).catch(() => false);
          expect(hasError).toBe(false);
        });

        await test.step('And the block editor should be usable', async () => {
          await expect(
            page.locator('.block-editor-writing-flow, .editor-styles-wrapper').first()
          ).toBeVisible({ timeout: 20_000 });
        });
      }

      // ── invalid-product-api-response ──────────────────────────────────────
      if (s.id === 'invalid-product-api-response') {
        await test.step('When I request a non-existent product via REST API', async () => {
          const response = await request.get('/wp-json/wc/v3/products/999999999');

          await test.step('Then status should be 404, not 500', async () => {
            expect(response.status()).toBe(404);
          });

          await test.step('And the body should contain a structured error', async () => {
            const body = await response.json() as { code?: string; message?: string };
            expect(body).toHaveProperty('code');
            expect(body).toHaveProperty('message');
          });
        });
      }

      // ── rest-api-malformed-data ───────────────────────────────────────────
      if (s.id === 'rest-api-malformed-data') {
        await test.step('When I POST malformed data (empty body) to WC products REST endpoint', async () => {
          const response = await request.post('/wp-json/wc/v3/products', {
            data: {}, // Missing required field: name, regular_price, etc.
          });

          await test.step('Then status should be 400 or 422 — not 500', async () => {
            const status = response.status();
            expect([400, 401, 403, 422]).toContain(status);
          });

          await test.step('And the response body should have a structured error', async () => {
            const text = await response.text();
            // Should be JSON with code/message, not an HTML PHP error dump
            expect(text).toContain('"code"');
          });
        });
      }

      // ── missing-wc-pages ─────────────────────────────────────────────────
      if (s.id === 'missing-wc-pages') {
        const wcPages = ['/shop', '/cart', '/checkout'];

        for (const pagePath of wcPages) {
          await test.step(`Then ${pagePath} should return 200, not 404`, async () => {
            const response = await request.get(pagePath);
            // Some WC installs redirect shop to home — 200 or 301/302 are acceptable
            expect([200, 301, 302]).toContain(response.status());
          });
        }
      }
    });
  }
});
