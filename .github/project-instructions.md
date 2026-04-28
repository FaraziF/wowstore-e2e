# WordPress Plugin E2E Testing with Playwright – AI Coding Agent Instructions

## Architecture Overview
This is a comprehensive Playwright-based end-to-end test suite for WordPress plugins, with special emphasis on WooCommerce-dependent plugins (both free and pro versions). The framework handles plugin activation, admin interface testing, frontend functionality, WooCommerce integration, and cross-version compatibility.

**Key Components:**
- `tests/setup/` - Authentication setup and environment preparation
- `tests/plugin/` - Plugin activation, deactivation, and version-specific tests
- `tests/admin/` - Admin interface testing (settings, dashboards, menus)
- `tests/frontend/` - Anonymous user flows and public-facing functionality
- `tests/woocommerce/` - WooCommerce-specific features (products, cart, checkout)
- `tests/blocks/` - Gutenberg block editor integration and custom blocks
- `tests/api/` - REST API testing and data management
- `pages/` - Page Object Models for WordPress admin and frontend
- `utils/wordpress.ts` - WordPress admin helpers, authentication, and Gutenberg utilities
- `utils/woocommerce.ts` - WooCommerce REST API helpers with nonce caching
- `utils/plugin.ts` - Plugin-specific utilities for version management

## Critical Workflows
- **Environment Setup**: Configure WordPress with WooCommerce, set up test database, handle plugin versions (free/pro)
- **Authentication**: Save admin auth state, handle WooCommerce customer auth, manage API keys
- **Plugin Management**: Test activation/deactivation, version upgrades, dependency checks
- **Data Management**: Create/cleanup WooCommerce data (products, categories, orders) via API
- **Cross-Version Testing**: Run tests against different WordPress/WooCommerce/plugin version combinations
- **Performance Validation**: Monitor load times, AJAX responses, and resource usage

## Project Conventions
- **Version Handling**: Use environment variables or config to switch between free/pro plugin versions
- **WooCommerce Dependency**: Always verify WC is active before running WC-dependent tests
- **API-First Approach**: Prefer REST API for data setup/cleanup over UI interactions
- **Selector Strategy**: Use semantic selectors (roles, labels) with XPath fallbacks for WordPress robustness
- **Test Isolation**: Reset plugin settings and WooCommerce data between test suites
- **Error Handling**: Test graceful degradation when WooCommerce is inactive or incompatible

## Integration Points
- **WordPress Core**: Admin navigation, user management, plugin system
- **WooCommerce**: Product management, cart/checkout flows, REST API
- **Gutenberg Editor**: Block registration, editor interactions, frontend rendering
- **Plugin Architecture**: Settings pages, custom post types, taxonomies, shortcodes
- **Version Compatibility**: WordPress core updates, WooCommerce versions, PHP compatibility

## Examples

**Plugin Version Testing:**
```typescript
// Test both free and pro versions
const versions = ['free', 'pro'];
for (const version of versions) {
  test.describe(`Plugin ${version} version`, () => {
    test.beforeAll(async () => {
      await activatePluginVersion(version);
    });

    test('core functionality works', async ({ page }) => {
      // Test implementation
    });
  });
}
```

**WooCommerce Integration Test:**
```typescript
test('plugin enhances WooCommerce product page', async ({ page }) => {
  // Ensure WooCommerce is active
  await ensureWooCommerceActive();

  // Create test product
  const product = await createWooCommerceProduct({
    name: 'Test Product',
    type: 'simple',
    regular_price: '29.99'
  });

  // Navigate to product page
  await page.goto(product.permalink);

  // Verify plugin enhancements
  await expect(page.locator('.plugin-enhancement')).toBeVisible();
});
```

**Gutenberg Block Testing:**
```typescript
test('custom WooCommerce block in editor', async ({ page }) => {
  await page.goto('/wp-admin/post-new.php');
  await waitForGutenbergEditor(page);

  // Insert block
  await page.click('.edit-post-header-toolbar__inserter-toggle');
  await page.fill('.block-editor-inserter__search-input', 'WooCommerce Block');
  await page.click('button[aria-label*="WooCommerce Block"]');

  // Configure block settings
  await page.locator('[data-type="plugin/woocommerce-block"]').click();
  await page.fill('.components-text-control__input', 'Block Title');

  // Verify frontend rendering
  await publishPost(page);
  await verifyBlockFrontend(page);
});
```

**API Data Management:**
```typescript
test.beforeAll(async ({ request }) => {
  // Create test data via WooCommerce API
  productId = await createProduct(request, {
    name: 'E2E Test Product',
    regular_price: '19.99',
    categories: [categoryId]
  });

  orderId = await createOrder(request, {
    line_items: [{ product_id: productId, quantity: 1 }]
  });
});

test.afterAll(async ({ request }) => {
  // Cleanup
  await deleteProduct(request, productId);
  await deleteOrder(request, orderId);
});
```

## WooCommerce-Specific Testing Patterns

**Product Management:**
- Test product creation, editing, deletion
- Verify pricing, inventory, variations
- Check category and tag assignments

**Cart and Checkout:**
- Add/remove products from cart
- Test shipping calculations
- Verify payment gateway integration
- Handle coupon applications

**Customer Accounts:**
- Registration and login flows
- Order history and tracking
- Account settings management

**Admin Integration:**
- Product management interface
- Order processing workflows
- Analytics and reporting

## Version Compatibility Matrix

Test against combinations of:
- WordPress versions (latest 3 major versions)
- WooCommerce versions (current + previous major)
- PHP versions (supported by WordPress/WC)
- Plugin versions (free vs pro features)

## Performance and Reliability

- Use single worker for WordPress state management
- Implement proper waiting strategies for AJAX calls
- Cache authentication and API nonces
- Monitor for console errors and failed requests
- Validate page load times and resource usage

## Troubleshooting Common Issues

**WooCommerce Not Active:**
```typescript
test.skip('WooCommerce required', async () => {
  const wcActive = await isPluginActive('woocommerce');
  if (!wcActive) test.skip();
});
```

**Version Conflicts:**
```typescript
test('compatible with WooCommerce X.X', async ({ page }) => {
  const wcVersion = await getWooCommerceVersion();
  test.skip(wcVersion !== 'X.X', 'Test specific to WC X.X');
});
```

**Dynamic Content Loading:**
```typescript
// Wait for WooCommerce AJAX
await page.waitForResponse(response =>
  response.url().includes('wc-ajax') &&
  response.status() === 200
);
```

This framework provides a robust foundation for testing WordPress plugins with WooCommerce integration, ensuring compatibility across versions and maintaining high-quality user experiences.</content>
<parameter name="filePath">.github/copilot-instructions.md