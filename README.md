# WowStore E2E Test Suite – Playwright

> End-to-end automation for **WowStore – Store Builder & Product Blocks for WooCommerce**  
> Built with [Playwright](https://playwright.dev) · Covers plugin activation, all product blocks, the store builder, WooCommerce integration & frontend shopper flows.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running Tests](#running-tests)
6. [Test Coverage Map](#test-coverage-map)
7. [Tag System](#tag-system)
8. [Page Object Models](#page-object-models)
9. [Utilities](#utilities)
10. [CI/CD Integration](#cicd-integration)
11. [Troubleshooting](#troubleshooting)

---

## Project Structure

```
wowstore-e2e/
├── playwright.config.js          # Playwright configuration (projects, browsers, auth)
├── package.json
├── .env.example                  # Copy to .env and fill in your values
│
├── tests/
│   ├── setup/
│   │   └── auth.setup.js         # Saves admin auth state (runs first)
│   │
│   ├── plugin/
│   │   ├── plugin-activation.spec.js   # Plugin activate/deactivate, menu item
│   │   └── dashboard.spec.js           # WowStore admin dashboard
│   │
│   ├── blocks/
│   │   ├── product-grid.spec.js        # Product Grid block (editor + frontend)
│   │   ├── product-list-slider.spec.js # Product List & Slider blocks
│   │   └── product-category.spec.js    # Product Category block
│   │
│   ├── store-builder/
│   │   └── store-builder.spec.js       # Template library, page builder access
│   │
│   ├── frontend/
│   │   └── frontend-shop.spec.js       # Anonymous shopper: browse, add to cart, QV, search
│   │
│   └── woocommerce/
│       └── woocommerce-integration.spec.js  # WC shop/product/cart/checkout/my-account
│
├── pages/                        # Page Object Models
│   ├── WowStoreDashboardPage.js
│   ├── BlockEditorPage.js
│   └── FrontendShopPage.js
│
└── utils/                        # Shared helpers
    ├── wordpress.js              # WP admin helpers (navigate, auth, editor utils)
    └── woocommerce.js            # WC REST API helpers (create/delete products, categories)
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18 |
| WordPress | ≥ 6.4 |
| WooCommerce | ≥ 8.0 |
| WowStore plugin | Latest (active) |
| WooCommerce REST API | Enabled (Application Passwords or Basic Auth) |

**Local WordPress stacks that work well:**

- [Local by Flywheel](https://localwp.com/)
- [wp-env](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/) (`@wordpress/env`)
- Docker / DDEV
- XAMPP / MAMP

---

## Installation

```bash
# 1. Clone / copy this folder into your project
cd wowstore-e2e

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install --with-deps chromium firefox

# 4. Copy and edit the environment file
cp .env.example .env
```

---

## Configuration

Edit `.env` with your local WordPress details:

```dotenv
WP_BASE_URL=http://localhost:8888   # Your WordPress site URL (no trailing slash)
WP_ADMIN_USER=admin
WP_ADMIN_PASSWORD=password
WC_CUSTOMER_USER=customer
WC_CUSTOMER_PASSWORD=customer123
```

> **WooCommerce REST API:** The test utilities use HTTP Basic Auth against the WC REST API  
> (`/wp-json/wc/v3/`). Make sure **Application Passwords** or the  
> [Basic Auth plugin](https://github.com/WP-API/Basic-Auth) is enabled on your dev site.

---

## Running Tests

```bash
# Run the full suite
npm test

# Run in headed mode (watch the browser)
npm run test:headed

# Open Playwright UI mode (interactive)
npm run test:ui

# Run only smoke tests (fast CI gate)
npm run test:smoke

# Run a specific feature area
npm run test:plugin         # Plugin activation & dashboard
npm run test:blocks         # All product blocks
npm run test:store-builder  # Template library & store builder
npm run test:frontend       # Anonymous shopper flows
npm run test:woocommerce    # Full WooCommerce integration

# Debug a single file
npx playwright test tests/blocks/product-grid.spec.js --debug

# Open last HTML report
npm run report
```

---

## Test Coverage Map

| Area | File | Key Scenarios |
|---|---|---|
| **Plugin** | `plugin-activation.spec.js` | Listed in plugins, activate/deactivate, no fatal errors, menu item appears, WC dependency check |
| **Dashboard** | `dashboard.spec.js` | Loads without JS errors, load time < 4 s, nav tabs, template section, settings link |
| **Product Grid** | `product-grid.spec.js` | Available in inserter, insert into editor, renders products on frontend, title/price visible, Add to Cart |
| **Product List** | `product-list-slider.spec.js` | Available in inserter, insert into editor |
| **Product Slider** | `product-list-slider.spec.js` | Available in inserter, carousel renders on frontend, next/prev arrows clickable |
| **Product Category** | `product-category.spec.js` | Available in inserter, renders on frontend, links to category archive |
| **Store Builder** | `store-builder.spec.js` | Template library visible, Import button exists, Shop/Single/Cart/Checkout/MyAccount/Header-Footer templates listed |
| **Frontend Shop** | `frontend-shop.spec.js` | Products render, titles & prices, images not broken, Add to Cart, cart icon updates, Quick View open/close/details, Search, Cart page |
| **WC Integration** | `woocommerce-integration.spec.js` | Shop page, single product page, Add to Cart, product images, cart totals, checkout billing form, My Account, WowStore admin, product filtering |

**Total: 40+ individual test cases**

---

## Tag System

Each test is tagged so you can selectively run subsets:

| Tag | Purpose | Command |
|---|---|---|
| `@smoke` | Fastest, most critical checks – run on every PR | `npm run test:smoke` |
| `@regression` | Full feature regression – run before every release | `npm run test:regression` |

Example: `test('plugin is listed @smoke', ...)` → `npx playwright test --grep @smoke`

---

## Page Object Models

### `WowStoreDashboardPage`

Wraps the WowStore admin dashboard (`/wp-admin/admin.php?page=wowstore`).

```js
import { WowStoreDashboardPage } from '../pages/WowStoreDashboardPage.js';

const dashboard = new WowStoreDashboardPage(page);
await dashboard.goto();
await dashboard.assertVisible();
await dashboard.clickTab('Templates');
await dashboard.saveSettings();
```

### `BlockEditorPage`

Wraps Gutenberg block editor for inserting and configuring WowStore blocks.

```js
import { BlockEditorPage } from '../pages/BlockEditorPage.js';

const editor = new BlockEditorPage(page);
await editor.gotoNewPage();
await editor.waitForReady();
await editor.setTitle('My Test Page');
await editor.insertBlock('Product Grid');
await editor.publish();
const url = await editor.getViewUrl();
```

### `FrontendShopPage`

Wraps anonymous-shopper interactions on the WooCommerce frontend.

```js
import { FrontendShopPage } from '../pages/FrontendShopPage.js';

const shop = new FrontendShopPage(page);
await shop.gotoShop();
await shop.addFirstProductToCart();
await shop.openQuickView();
await shop.gotoCart();
```

---

## Utilities

### `utils/wordpress.js`

| Function | Description |
|---|---|
| `goToAdminPage(page, path)` | Navigate to a WP admin URL and wait for networkidle |
| `dismissAdminNotices(page)` | Click all `.notice-dismiss` buttons |
| `waitForBlockEditor(page)` | Wait for Gutenberg canvas to be interactive |
| `searchAndGetBlock(page, name)` | Open inserter, search, return first result locator |
| `publishPost(page)` | Click Publish, handle pre-publish panel |
| `createPageViaApi(request, title, content)` | Create a WP page via REST API |
| `deletePostViaApi(request, postId)` | Delete a post/page via REST API |
| `getWpNonce(page)` | Extract the WP REST nonce from the current page |

### `utils/woocommerce.js`

| Function | Description |
|---|---|
| `createProduct(request, overrides)` | Create a WC product via REST API |
| `createCategory(request, name)` | Create a WC product category via REST API |
| `deleteProduct(request, productId)` | Permanently delete a WC product |
| `deleteCategory(request, categoryId)` | Permanently delete a WC category |
| `getShopUrl(request)` | Resolve the WooCommerce shop page permalink |

---

## CI/CD Integration

### GitHub Actions example

```yaml
# .github/workflows/e2e.yml
name: WowStore E2E

on:
  push:
    branches: [main, release/**]
  pull_request:

jobs:
  e2e:
    runs-on: ubuntu-latest

    services:
      # Spin up WordPress + WooCommerce + WowStore using wp-env or Docker here
      # (adjust to match your stack)

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci
        working-directory: wowstore-e2e

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
        working-directory: wowstore-e2e

      - name: Run smoke tests
        env:
          WP_BASE_URL:        ${{ secrets.WP_BASE_URL }}
          WP_ADMIN_USER:      ${{ secrets.WP_ADMIN_USER }}
          WP_ADMIN_PASSWORD:  ${{ secrets.WP_ADMIN_PASSWORD }}
        run: npx playwright test --grep @smoke
        working-directory: wowstore-e2e

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: wowstore-e2e/playwright-report/
          retention-days: 14
```

### wp-env quick-start (recommended for CI)

```bash
# Install wp-env globally
npm install -g @wordpress/env

# Start WordPress with WooCommerce + WowStore
wp-env start

# Run e2e tests
cd wowstore-e2e && npm test
```

Add a `.wp-env.json` at your repo root:

```json
{
  "core":    "WordPress/WordPress#trunk",
  "plugins": [
    "https://downloads.wordpress.org/plugin/woocommerce.latest-stable.zip",
    "https://downloads.wordpress.org/plugin/product-blocks.latest-stable.zip",
    "."
  ],
  "port": 8888
}
```

---

## Troubleshooting

### Tests fail on the auth step

- Confirm `WP_BASE_URL`, `WP_ADMIN_USER`, `WP_ADMIN_PASSWORD` in `.env` are correct.
- Run `npx playwright test --headed` to watch the login page.
- Check that `playwright/.auth/` directory is writable.

### WooCommerce API returns 401

- Enable **Application Passwords** in WordPress (`Users → Profile → Application Passwords`).
- Or install the [WP REST API – Basic Auth](https://github.com/WP-API/Basic-Auth) plugin on your dev site.

### Block inserter search returns no WowStore blocks

- Confirm WowStore is **activated** and WooCommerce is also active.
- WowStore blocks are registered only when WC is active — a missing dependency hides all blocks.

### Flaky tests in CI

- Increase `retries` in `playwright.config.js` (currently `2` in CI).
- Add `actionTimeout` or specific `waitFor` calls around WC AJAX-heavy operations.
- Ensure your CI environment has enough RAM for WordPress (≥ 512 MB recommended).

### Quick View tests skip

- Quick View is a **WowStore Pro** feature. The tests detect its absence and skip gracefully rather than fail.

---

## Adding New Tests

1. Create a new `.spec.js` file in the appropriate `tests/` subfolder.
2. Import the relevant Page Object and/or utility helpers.
3. Tag tests with `@smoke` or `@regression`.
4. Use `test.beforeAll` with API helpers to create test data; clean up in `test.afterAll`.

```js
import { test, expect } from '@playwright/test';
import { createProduct, deleteProduct } from '../../utils/woocommerce.js';

test.describe('My New Feature @regression', () => {
  let productId;

  test.beforeAll(async ({ request }) => {
    const p = await createProduct(request, { name: 'My Test Product' });
    productId = p.id;
  });

  test.afterAll(async ({ request }) => {
    await deleteProduct(request, productId);
  });

  test('feature works as expected', async ({ page }) => {
    // ...
  });
});
```
