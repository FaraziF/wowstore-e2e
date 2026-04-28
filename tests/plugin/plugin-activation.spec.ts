// tests/plugin/plugin-activation.spec.ts
// Verifies that WowStore can be deactivated and re-activated without errors.
// Tags: @smoke @regression
//
// URL source: baseURL is read from WP_BASE_URL in .env via playwright.config.ts.
// All navigation uses relative paths — no hardcoded hostnames in this file.

import { test, expect } from '@playwright/test';
import {
  pluginActivationScenarios,
} from '../scenarios/pluginActivation.scenarios';

const PLUGIN_SLUG  = 'product-blocks'; // WowStore folder slug
const PLUGIN_LABEL = /WowStore/i;

test.describe('WowStore Plugin Activation (BDD)', () => {
  test.beforeEach(async ({ page }) => {
    // baseURL resolved from WP_BASE_URL in .env
    await page.goto('/wp-admin/plugins.php');
    await page.waitForLoadState('networkidle');
  });

  for (const s of pluginActivationScenarios) {
    test(s.title, async ({ page }) => {
      // Attach Gherkin text as annotation for reporting
      await test.step('Gherkin', async () => {
        test.info().annotations.push({ type: 'gherkin', description: s.gherkin });
      });

      // ── plugin-listed ─────────────────────────────────────────────────────
      if (s.id === 'plugin-listed') {
        await test.step('Given I navigate to the Plugins page', async () => {
          // beforeEach already navigated — page is ready
        });

        await test.step('Then the WowStore plugin row should be visible', async () => {
          const row = page.locator(`tr[data-slug="${PLUGIN_SLUG}"]`).first();
          await expect(row).toBeVisible();
        });

        await test.step('And the row should contain the text "WowStore"', async () => {
          const row = page.locator(`tr[data-slug="${PLUGIN_SLUG}"]`).first();
          await expect(row).toContainText(PLUGIN_LABEL);
        });
      }

      // ── plugin-deactivate-reactivate ─────────────────────────────────────
      if (s.id === 'plugin-deactivate-reactivate') {
        const row = page.locator(`tr[data-slug="${PLUGIN_SLUG}"]`).first();

        await test.step('Given the plugin row is visible', async () => {
          await expect(row).toBeVisible();
        });

        await test.step('When the plugin is currently active and I click Deactivate', async () => {
          const deactivateLink = row.locator('a:has-text("Deactivate")');
          if (await deactivateLink.isVisible()) {
            await deactivateLink.click();
          }
        });

        await test.step('And I dismiss the deactivation feedback modal if it appears', async () => {
          const modal = page.locator('#wopb-deactive-modal');
          if (await modal.isVisible({ timeout: 4_000 }).catch(() => false)) {
            await modal.locator('a.wopb-modal-deactive').click();
          }
          await page.waitForLoadState('networkidle');
        });

        await test.step('Then a deactivation success notice should be visible', async () => {
          const deactivationNotice = page
            .locator('#message.updated, .notice-success, .updated')
            .first();
          await expect(deactivationNotice).toBeVisible({ timeout: 8_000 });
        });

        await test.step('And the Activate link should be present', async () => {
          await expect(row.locator('a:has-text("Activate")')).toBeVisible();
        });

        await test.step('When I click the Activate link', async () => {
          const activateLink = row.locator('a:has-text("Activate")');
          await activateLink.click();
          await page.waitForLoadState('networkidle');
        });

        await test.step('Then the plugin is activated successfully', async () => {
          const currentUrl = page.url();
          if (currentUrl.includes('wopb-settings')) {
            await expect(
              page.locator('.wopb-settings-tab-wrap, .wopb-setting-header').first(),
            ).toBeVisible({ timeout: 10_000 });
          } else {
            const activationNotice = page
              .locator('#message.updated, .notice-success, .updated')
              .first();
            await expect(activationNotice).toBeVisible({ timeout: 8_000 });
          }
        });

        await test.step('And the Deactivate link should be present on the plugins page', async () => {
          // baseURL resolved from WP_BASE_URL in .env
          await page.goto('/wp-admin/plugins.php');
          await page.waitForLoadState('networkidle');
          await expect(row.locator('a:has-text("Deactivate")')).toBeVisible();
        });
      }

      // ── no-fatal-errors ───────────────────────────────────────────────────
      if (s.id === 'no-fatal-errors') {
        await test.step('Given I navigate to the Plugins page', async () => {
          // beforeEach already navigated — page is ready
        });

        await test.step('Then no PHP fatal or critical error notice should be visible', async () => {
          const fatalNotice = page
            .locator('.notice-error, .error')
            .filter({ hasText: /fatal|critical/i });
          await expect(fatalNotice).toHaveCount(0);
        });
      }

      // ── admin-menu-visible ────────────────────────────────────────────────
      if (s.id === 'admin-menu-visible') {
        await test.step('Given I navigate to the Plugins page', async () => {
          // beforeEach already navigated — page is ready
        });

        await test.step('Then the WowStore item should be visible in the WordPress admin menu', async () => {
          const menuItem = page
            .locator('#adminmenu')
            .locator('a')
            .filter({ hasText: /WowStore/i })
            .first();
          await expect(menuItem).toBeVisible();
        });
      }

      // ── woocommerce-dependency-not-shown ──────────────────────────────────
      if (s.id === 'woocommerce-dependency-not-shown') {
        await test.step('Given I navigate to the Plugins page', async () => {
          // beforeEach already navigated — page is ready
        });

        await test.step('Then no WooCommerce dependency notice should be visible', async () => {
          const depNotice = page
            .locator('.notice, .error')
            .filter({ hasText: /WooCommerce.*required|requires WooCommerce/i });
          await expect(depNotice).toHaveCount(0);
        });
      }
    });
  }
});
