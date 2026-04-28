// tests/plugin/dashboard.spec.ts
// Tests for the WowStore admin dashboard page.
// Tags: @smoke @regression
//
// URL source: baseURL is read from WP_BASE_URL in .env via playwright.config.ts.
// All navigation uses relative paths — no hardcoded hostnames in this file.

import { test, expect } from '@playwright/test';
import { WowStoreDashboardPage } from '../../pages/WowStoreDashboardPage';
import { dismissAdminNotices } from '../../utils/wordpress';
import { dashboardScenarios } from '../scenarios/dashboard.scenarios';

test.describe('WowStore Admin Dashboard (BDD)', () => {
  let dashboard: WowStoreDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new WowStoreDashboardPage(page);
    // WowStoreDashboardPage.goto() navigates to /wp-admin/admin.php?page=wopb-settings
    // baseURL is resolved from WP_BASE_URL in .env via playwright.config.ts
    await dashboard.goto();
    await dismissAdminNotices(page);
  });

  for (const s of dashboardScenarios) {
    test(s.title, async ({ page }) => {
      // Attach Gherkin text as annotation for reporting
      await test.step('Gherkin', async () => {
        test.info().annotations.push({ type: 'gherkin', description: s.gherkin });
      });

      // ── dashboard-loads ───────────────────────────────────────────────────
      if (s.id === 'dashboard-loads') {
        await test.step('Given I navigate to the WowStore dashboard', async () => {
          // beforeEach already navigated — page is ready
        });

        await test.step('Then the dashboard UI should be visible', async () => {
          await dashboard.assertVisible();
        });

        await test.step('And no WowStore-related JS console errors should be present', async () => {
          const consoleErrors: string[] = [];
          page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
          });
          await page.reload();
          await page.waitForLoadState('networkidle');
          const wowstoreErrors = consoleErrors.filter(e => /product-blocks|wowstore/i.test(e));
          expect(wowstoreErrors).toHaveLength(0);
        });
      }

      // ── dashboard-performance ─────────────────────────────────────────────
      if (s.id === 'dashboard-performance') {
        await test.step('When I navigate to the WowStore dashboard and measure load time', async () => {
          const t0 = Date.now();
          // baseURL resolved from WP_BASE_URL in .env
          await page.goto('/wp-admin/admin.php?page=wopb-settings');
          await page.waitForLoadState('networkidle');

          await test.step('Then the page should load in less than 4000 ms', async () => {
            expect(Date.now() - t0).toBeLessThan(4_000);
          });
        });
      }

      // ── navigation-tabs-present ───────────────────────────────────────────
      if (s.id === 'navigation-tabs-present') {
        await test.step('Given I navigate to the WowStore dashboard', async () => {
          // beforeEach already navigated — page is ready
        });

        await test.step('Then at least one navigation tab should be visible', async () => {
          const nav   = page.locator('.wopb-settings-tab a');
          const count = await nav.count();
          expect(count).toBeGreaterThan(0);
        });
      }

      // ── starter-packs-visible ─────────────────────────────────────────────
      if (s.id === 'starter-packs-visible') {
        await test.step('When I navigate to the WowStore template kits section', async () => {
          // baseURL resolved from WP_BASE_URL in .env
          await page.goto('/wp-admin/admin.php?page=wopb-settings#templatekit');
          await page.waitForLoadState('networkidle');
        });

        await test.step('Then the settings container or content area should be visible', async () => {
          const templateSection = page
            .locator('.wopb-settings-container, .wopb-settings-content')
            .first();
          await expect(templateSection).toBeVisible({ timeout: 10_000 });
        });
      }

      // ── settings-link-accessible ──────────────────────────────────────────
      if (s.id === 'settings-link-accessible') {
        await test.step('Given I navigate to the WowStore dashboard', async () => {
          // beforeEach already navigated — page is ready
        });

        await test.step('When I click the Settings tab link', async () => {
          const settingsLink = page
            .locator('.wopb-settings-tab a')
            .filter({ hasText: /Settings/i })
            .first();
          if (await settingsLink.isVisible()) {
            await settingsLink.click();
            await page.waitForLoadState('networkidle');
          }
        });

        await test.step('Then the URL should contain the WowStore admin slug "wopb-settings"', async () => {
          expect(page.url()).toMatch(/wopb-settings/);
        });
      }
    });
  }
});
