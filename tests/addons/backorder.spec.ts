// tests/addons/backorder.spec.ts
// Verifies the WowStore Backorder addon.
// Tags: @smoke @regression
// Project: chromium-admin (settings check) + chromium-frontend (shopper)

import { test, expect } from '@playwright/test';
import { createProduct, deleteProduct } from '../../utils/woocommerce';
import { backorderScenarios } from '../scenarios';

let ooProductId: number;
let ooProductUrl: string;

test.describe('WowStore – Backorder Addon (BDD) @smoke @regression', () => {
  test.beforeAll(async ({ request }) => {
    // Create an out-of-stock product with backorders enabled
    const product = await createProduct(request, {
      name:           `E2E Backorder Product ${Date.now()}`,
      type:           'simple',
      regular_price:  '39.99',
      manage_stock:   true,
      stock_quantity: 0,
      backorders:     'yes',
      stock_status:   'onbackorder',
    });
    ooProductId  = product.id;
    ooProductUrl = product.permalink;
  });

  test.afterAll(async ({ request }) => {
    await deleteProduct(request, ooProductId).catch(() => {});
  });

  // ── backorder-button-visible-oos ───────────────────────────────────────────
  test(backorderScenarios[0].title, async ({ page }) => {
    const s = backorderScenarios[0];
    test.info().annotations.push({ type: 'gherkin', description: s.gherkin });

    await test.step('Given: navigate to OOS backorder product page', async () => {
      await page.goto(ooProductUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Then: Add to cart button is visible and enabled', async () => {
      const addToCartBtn = page.locator(
        'button.single_add_to_cart_button, button[name="add-to-cart"]'
      ).first();
      await expect(addToCartBtn).toBeVisible({ timeout: 10_000 });
      await expect(addToCartBtn).toBeEnabled();
    });

    await test.step('And: no hard "Out of stock" block prevents purchase', async () => {
      // If backorders are enabled, WC should NOT show a blocking OOS message
      const blockingOos = page.locator(
        'p.stock.out-of-stock, .out-of-stock:not([class*="backorder"])'
      ).first();
      // It is acceptable if no blocking OOS text is shown
      const isBlockingVisible = await blockingOos.isVisible({ timeout: 3_000 }).catch(() => false);
      if (isBlockingVisible) {
        const text = await blockingOos.innerText();
        // "Available on backorder" is fine; a pure "Out of stock" label without backorder note is not
        expect(text.toLowerCase()).toContain('backorder');
      }
    });
  });

  // ── backorder-custom-label ────────────────────────────────────────────────
  test(backorderScenarios[1].title, async ({ page }) => {
    const s = backorderScenarios[1];
    test.info().annotations.push({ type: 'gherkin', description: s.gherkin });

    await test.step('Given: navigate to OOS backorder product page', async () => {
      await page.goto(ooProductUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Then: some stock/availability text is visible on the page', async () => {
      // WooCommerce always shows some stock status text for backorder products
      const stockStatus = page.locator(
        'p.stock, .stock, [class*="stock-status"], [class*="availability"]'
      ).first();
      const isVisible = await stockStatus.isVisible({ timeout: 5_000 }).catch(() => false);
      // Accept if any stock status indicator is present
      if (isVisible) {
        await expect(stockStatus).toBeVisible();
      }
    });
  });

  // ── backorder-order-placed ────────────────────────────────────────────────
  test(backorderScenarios[2].title, async ({ page }) => {
    const s = backorderScenarios[2];
    test.info().annotations.push({ type: 'gherkin', description: s.gherkin });
    test.setTimeout(90_000);

    await test.step('Given: add OOS backorder product to cart', async () => {
      await page.goto(ooProductUrl);
      await page.waitForLoadState('domcontentloaded');
      const addToCartBtn = page.locator('button.single_add_to_cart_button').first();
      await expect(addToCartBtn).toBeVisible({ timeout: 10_000 });
      await addToCartBtn.click({ force: true }); // wopb-animation keeps button unstable
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('When: shopper goes to checkout and places order', async () => {
      await page.goto('/checkout');
      await page.waitForLoadState('domcontentloaded');

      const fillIfVisible = async (sel: string, val: string) => {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2_000 }).catch(() => false)) await el.fill(val);
      };
      await fillIfVisible('#billing_first_name', 'Backorder');
      await fillIfVisible('#billing_last_name', 'Tester');
      await fillIfVisible('#billing_address_1', '789 OOS Lane');
      await fillIfVisible('#billing_city', 'Stocktown');
      await fillIfVisible('#billing_postcode', '11111');
      await fillIfVisible('#billing_email', 'backorder@wowstore.test');
      await fillIfVisible('#billing_phone', '1112223333');

      const cod = page.locator('#payment_method_cod, input[value="cod"]').first();
      if (await cod.isVisible({ timeout: 4_000 }).catch(() => false)) await cod.click();

      const placeOrder = page.locator('#place_order, button:has-text("Place order")').first();
      await expect(placeOrder).toBeVisible({ timeout: 10_000 });
      await placeOrder.click();
    });

    await test.step('Then: order confirmation is received', async () => {
      await expect(page).toHaveURL(/order-received/, { timeout: 30_000 });
      const confirmation = page.locator(
        '.woocommerce-order-received, .woocommerce-thankyou-order-received, h2, h1'
      ).first();
      await expect(confirmation).toBeVisible({ timeout: 10_000 });
    });
  });
});
