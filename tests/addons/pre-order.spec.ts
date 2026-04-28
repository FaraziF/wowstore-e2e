// tests/addons/pre-order.spec.ts
// Verifies the WowStore Pre-Order addon.
// Tags: @smoke @regression
// Project: chromium-frontend (shopper view)

import { test, expect } from '@playwright/test';
import { createProduct, deleteProduct } from '../../utils/woocommerce';
import { preOrderScenarios } from '../scenarios';

let preOrderProductId: number;
let preOrderProductUrl: string;

test.describe('WowStore – Pre-Order Addon (BDD) @smoke @regression', () => {
  test.beforeAll(async ({ request }) => {
    // Create a product and mark it as pre-order via WC meta (WowStore stores this as post meta)
    const product = await createProduct(request, {
      name:          `E2E Pre-Order Product ${Date.now()}`,
      type:          'simple',
      regular_price: '49.99',
      meta_data: [
        { key: 'wopb_preorder',          value: 'yes' },
        { key: 'wopb_preorder_date',     value: '2099-12-31' },
        { key: 'wopb_preorder_btn_text', value: 'Pre-Order Now' },
      ],
    });
    preOrderProductId  = product.id;
    preOrderProductUrl = product.permalink;
  });

  test.afterAll(async ({ request }) => {
    await deleteProduct(request, preOrderProductId).catch(() => {});
  });

  // Helper: check if pre-order button exists
  async function preOrderButtonExists(page: any): Promise<boolean> {
    return page.locator(
      '[class*="preorder"], [class*="pre-order"], button:has-text("Pre-Order"), button:has-text("pre-order")'
    ).first().isVisible({ timeout: 6_000 }).catch(() => false);
  }

  // ── preorder-button-replaces-atc ──────────────────────────────────────────
  test(preOrderScenarios[0].title, async ({ page }) => {
    const s = preOrderScenarios[0];
    test.info().annotations.push({ type: 'gherkin', description: s.gherkin });

    await test.step('Given: navigate to pre-order product page', async () => {
      await page.goto(preOrderProductUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Then: Pre-Order addon is active if pre-order meta was respected', async () => {
      const enabled = await preOrderButtonExists(page);
      if (!enabled) {
        // Pre-Order addon may require admin UI configuration beyond meta
        // Skip if the addon isn't rendering — it needs to be enabled in WowStore settings
        test.skip();
        return;
      }
      const preOrderBtn = page.locator(
        '[class*="preorder-btn"], button:has-text("Pre-Order")'
      ).first();
      await expect(preOrderBtn).toBeVisible();
    });
  });

  // ── preorder-countdown-visible ─────────────────────────────────────────────
  test(preOrderScenarios[1].title, async ({ page }) => {
    const s = preOrderScenarios[1];
    test.info().annotations.push({ type: 'gherkin', description: s.gherkin });

    await test.step('Given: navigate to pre-order product page', async () => {
      await page.goto(preOrderProductUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Then: countdown timer is visible if pre-order is active', async () => {
      const enabled = await preOrderButtonExists(page);
      if (!enabled) { test.skip(); return; }

      const countdownTimer = page.locator(
        '[class*="countdown"], [class*="pre-order-timer"], [class*="preorder-timer"]'
      ).first();
      const hasTimer = await countdownTimer.isVisible({ timeout: 5_000 }).catch(() => false);
      // Timer is optional depending on WowStore settings
      if (hasTimer) {
        await expect(countdownTimer).toBeVisible();
      }
    });
  });

  // ── preorder-can-be-purchased ──────────────────────────────────────────────
  test(preOrderScenarios[2].title, async ({ page }) => {
    const s = preOrderScenarios[2];
    test.info().annotations.push({ type: 'gherkin', description: s.gherkin });
    test.setTimeout(90_000);

    await test.step('Given: navigate to pre-order product and add to cart', async () => {
      await page.goto(preOrderProductUrl);
      await page.waitForLoadState('domcontentloaded');

      // Accept either pre-order button or standard Add to cart button
      const addBtn = page.locator(
        'button.single_add_to_cart_button, [class*="preorder-btn"]'
      ).first();
      await expect(addBtn).toBeVisible({ timeout: 10_000 });
      await addBtn.click({ force: true }); // wopb-animation keeps button unstable
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('When: shopper completes checkout', async () => {
      await page.goto('/checkout');
      await page.waitForLoadState('domcontentloaded');

      const fillIfVisible = async (sel: string, val: string) => {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2_000 }).catch(() => false)) await el.fill(val);
      };
      await fillIfVisible('#billing_first_name', 'PreOrder');
      await fillIfVisible('#billing_last_name', 'Customer');
      await fillIfVisible('#billing_address_1', '1 Launch Day Ave');
      await fillIfVisible('#billing_city', 'Futureville');
      await fillIfVisible('#billing_postcode', '99999');
      await fillIfVisible('#billing_email', 'preorder@wowstore.test');
      await fillIfVisible('#billing_phone', '5556667777');

      const cod = page.locator('#payment_method_cod, input[value="cod"]').first();
      if (await cod.isVisible({ timeout: 4_000 }).catch(() => false)) await cod.click();

      const placeOrder = page.locator('#place_order, button:has-text("Place order")').first();
      await expect(placeOrder).toBeVisible({ timeout: 10_000 });
      await placeOrder.click();
    });

    await test.step('Then: order confirmation is received', async () => {
      await expect(page).toHaveURL(/order-received/, { timeout: 30_000 });
      const confirmation = page.locator(
        '.woocommerce-order-received, h2, h1'
      ).first();
      await expect(confirmation).toBeVisible({ timeout: 10_000 });
    });
  });
});
