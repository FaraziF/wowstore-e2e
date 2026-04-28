# WowStore E2E Test Suite – Playwright + TypeScript

> End-to-end automation for **WowStore – Store Builder & Product Blocks for WooCommerce**  
> Built with [Playwright](https://playwright.dev) + TypeScript · BDD Gherkin scenario registry · 50+ smoke & regression scenarios.

![Smoke](https://img.shields.io/badge/smoke-passing-brightgreen?style=flat-square)
![Regression](https://img.shields.io/badge/regression-passing-brightgreen?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square)
![Playwright](https://img.shields.io/badge/Playwright-latest-purple?style=flat-square)

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running Tests](#running-tests)
6. [Test Coverage Map](#test-coverage-map)
7. [Tag System](#tag-system)
8. [Gherkin Scenario Registry](#gherkin-scenario-registry)
9. [Page Object Models](#page-object-models)
10. [Utilities](#utilities)
11. [Known Skips & Why](#known-skips--why)
12. [CI/CD Integration](#cicd-integration)
13. [Troubleshooting](#troubleshooting)
14. [Adding New Tests](#adding-new-tests)

---

## Project Structure

```
wowstore-e2e/
├── playwright.config.ts          # Projects: chromium-admin, chromium-shopper
├── tsconfig.json
├── package.json
├── .env.example                  # Copy to .env and fill in your values
├── .env                          # ← gitignored (contains secrets)
│
├── tests/
│   ├── setup/
│   │   ├── auth.setup.ts          # Saves admin session → playwright/.auth/admin.json
│   │   └── customer-auth.setup.ts # Saves shopper session → playwright/.auth/customer.json
│   │
│   ├── plugin/
│   │   ├── plugin-activation.spec.ts
│   │   └── dashboard.spec.ts
│   │
│   ├── blocks/
│   │   ├── product-grid.spec.ts
│   │   ├── product-category.spec.ts
│   │   └── product-filter.spec.ts
│   │
│   ├── store-builder/
│   │   └── checkout-builder.spec.ts
│   │
│   ├── frontend/
│   │   ├── add-to-cart.spec.ts
│   │   └── purchase-journey.spec.ts
│   │
│   ├── addons/
│   │   ├── backorder.spec.ts
│   │   ├── pre-order.spec.ts
│   │   ├── variation-swatches.spec.ts
│   │   └── wishlist.spec.ts
│   │
│   ├── error-handling/
│   │   └── error-handling.spec.ts
│   │
│   ├── security/
│   │   └── security.spec.ts
│   │
│   ├── scenarios/                 # Gherkin BDD registry (source of truth)
│   │   ├── index.ts
│   │   ├── addToCart.scenarios.ts
│   │   ├── checkoutBuilder.scenarios.ts
│   │   ├── backorder.scenarios.ts
│   │   ├── preOrder.scenarios.ts
│   │   ├── variationSwatches.scenarios.ts
│   │   ├── wishlist.scenarios.ts
│   │   ├── productFilter.scenarios.ts
│   │   ├── productGrid.scenarios.ts
│   │   ├── productCategory.scenarios.ts
│   │   ├── purchaseJourney.scenarios.ts
│   │   ├── dashboard.scenarios.ts
│   │   ├── pluginActivation.scenarios.ts
│   │   ├── errorHandling.scenarios.ts
│   │   └── security.scenarios.ts
│   │
│   ├── pom/
│   │   ├── blocks/
│   │   │   ├── ProductGridBlockPanel.ts
│   │   │   └── ProductCategoryBlockPanel.ts
│   │   └── wp/
│   │       └── PostEditorPage.ts
│   │
│   └── wp/
│       └── helpers.ts
│
├── pages/
│   ├── WowStoreDashboardPage.ts
│   └── BlockEditorPage.ts
│
├── utils/
│   ├── woocommerce.ts             # WC REST API helpers
│   └── wordpress.ts               # WP admin helpers
│
├── scripts/
│   └── list-scenarios.ts          # CLI: print all scenarios as Markdown
│
└── .github/
    ├── workflows/
    │   └── wowstore-e2e.yml       # GitHub Actions CI workflow
    └── INSTRUCTIONS.md            # Coding standards & conventions
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18 |
| WordPress | ≥ 6.4 |
| WooCommerce | ≥ 8.0 |
| WowStore plugin | Latest (active) |

**Recommended local WordPress stacks:**

- [Local by Flywheel](https://localwp.com/)
- [wp-env](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/) (`@wordpress/env`)
- Docker / DDEV / XAMPP / MAMP

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/wowstore-e2e.git
cd wowstore-e2e

# 2. Install Node dependencies
npm install

# 3. Install Playwright browsers
npx playwright install --with-deps chromium

# 4. Set up your environment
cp .env.example .env
# Then edit .env with your local WordPress details
```

---

## Configuration

Edit `.env` with your local WordPress details:

```dotenv
# WordPress site URL (no trailing slash)
WP_BASE_URL=http://localhost:10008

# Admin credentials
WP_ADMIN_USER=admin
WP_ADMIN_PASSWORD=admin

# WooCommerce REST API keys
# Generate at: WooCommerce → Settings → Advanced → REST API
WC_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxx

# Shopper credentials
WC_CUSTOMER_USER=customer1
WC_CUSTOMER_PASSWORD=yourpassword
```

> **Authentication:** The test utilities use a WordPress REST nonce (cookie-based auth) for API calls. This is fetched automatically during the `auth.setup.ts` step using the admin session cookies — no Application Passwords plugin required.

---

## Running Tests

```bash
# Run the full suite
npm test

# Run in headed mode (watch the browser)
npm run test:headed

# Open Playwright UI mode (interactive)
npm run test:ui

# Run only smoke tests (fast CI gate, ~2–3 min)
npm run test:smoke
# or: npx playwright test --grep "@smoke"

# Run full regression suite
npm run test:regression
# or: npx playwright test --grep "@regression"

# Run a specific area
npx playwright test tests/frontend/
npx playwright test tests/addons/
npx playwright test tests/plugin/
npx playwright test tests/blocks/

# Debug a single file
npx playwright test tests/frontend/add-to-cart.spec.ts --debug

# Generate and view Scenarios report
npm run list:scenarios      # prints to terminal
npm run report              # open last HTML report

# Open last HTML report
npx playwright show-report
```

---

## Test Coverage Map

| Area | Spec File | Scenarios |
|---|---|---|
| **Plugin Activation** | `plugin/plugin-activation.spec.ts` | No fatal PHP errors, WC dependency notice absent |
| **Admin Dashboard** | `plugin/dashboard.spec.ts` | Loads < 4s, templates section, settings link |
| **Product Grid Block** | `blocks/product-grid.spec.ts` | Block available in inserter, renders on frontend |
| **Product Category Block** | `blocks/product-category.spec.ts` | Renders on frontend, links to category archive |
| **Product Filter Block** | `blocks/product-filter.spec.ts` | Filter by category/price, clear filters, pagination |
| **Checkout Builder** | `store-builder/checkout-builder.spec.ts` | Custom checkout loads, payment options, full order, empty-cart redirect |
| **Add to Cart** | `frontend/add-to-cart.spec.ts` | Simple product, variable product (selection required/after), quantity, cart count |
| **Purchase Journey** | `frontend/purchase-journey.spec.ts` | Browse shop → add to cart → checkout |
| **Backorder Addon** | `addons/backorder.spec.ts` | ATC available for backorder, custom label, purchase |
| **Pre-Order Addon** | `addons/pre-order.spec.ts` | Pre-order button, countdown timer, purchase |
| **Variation Swatches** | `addons/variation-swatches.spec.ts` | Color/size swatches visible, selection updates image, OOS swatch disabled |
| **Wishlist Addon** | `addons/wishlist.spec.ts` | Add to wishlist, product on wishlist page, persists after refresh, remove |
| **Error Handling** | `error-handling/error-handling.spec.ts` | WC version notice, graceful empty-state renders, API 404/structured errors |
| **Security** | `security/security.spec.ts` | Customer blocked from admin API, nonce validation, XSS escaping, HTML sanitization, unauthenticated data exposure |

**Total: 50+ individual test scenarios**

---

## Tag System

Each test is tagged so you can selectively run subsets:

| Tag | Purpose | When to Run |
|---|---|---|
| `@smoke` | Critical, fast path — < 3 min | Every PR, every push |
| `@regression` | Full feature regression | Before every release |
| `@error` | Edge cases & error state tests | Full regression |
| `@security` | Auth, XSS, sanitization checks | Full regression |

```bash
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"
npx playwright test --grep "@smoke|@regression"   # both
```

---

## Gherkin Scenario Registry

All test scenarios are defined in `tests/scenarios/` using a structured Gherkin format. This acts as the **single source of truth** for test coverage documentation.

Each scenario object has:
- `id` — unique machine-readable identifier
- `title` — Playwright test title (includes tags)
- `tags` — array of tag strings
- `gherkin` — full BDD Gherkin text

**Generate the coverage report:**

```bash
npm run list:scenarios
# outputs SCENARIOS.md with a full scenario table
```

See [SCENARIOS.md](./SCENARIOS.md) for the full scenario registry.

---

## Page Object Models

### `WowStoreDashboardPage`

Wraps the WowStore admin dashboard (`/wp-admin/admin.php?page=wowstore`).

```typescript
import { WowStoreDashboardPage } from '../pages/WowStoreDashboardPage';

const dashboard = new WowStoreDashboardPage(page);
await dashboard.goto();
await dashboard.assertVisible();
await dashboard.clickTab('Templates');
await dashboard.saveSettings();
```

### `BlockEditorPage`

Wraps the Gutenberg block editor for inserting and configuring WowStore blocks.

```typescript
import { BlockEditorPage } from '../pages/BlockEditorPage';

const editor = new BlockEditorPage(page);
await editor.gotoNewPage();
await editor.waitForReady();
await editor.setTitle('My Test Page');
await editor.insertBlock('Product Grid');
await editor.publish();
const url = await editor.getViewUrl();
```

---

## Utilities

### `utils/woocommerce.ts`

| Function | Description |
|---|---|
| `createProduct(request, overrides?)` | Create a WC product via REST API |
| `createCategory(request, name)` | Create a WC product category |
| `deleteProduct(request, productId)` | Permanently delete a product |
| `deleteCategory(request, categoryId)` | Permanently delete a category |
| `getShopUrl(request)` | Resolve the WooCommerce shop page permalink (throws if not found → use `.catch(() => '/shop')`) |
| `resetNonceCache()` | Clear the cached WP REST nonce (useful between test runs) |

### `utils/wordpress.ts`

| Function | Description |
|---|---|
| `goToAdminPage(page, path)` | Navigate to a WP admin URL |
| `dismissAdminNotices(page)` | Dismiss all `.notice-dismiss` banners |
| `waitForBlockEditor(page)` | Wait for Gutenberg canvas to be interactive |
| `publishPost(page)` | Click Publish and handle the pre-publish panel |

---

## Known Skips & Why

Some tests skip gracefully rather than fail when a feature is not configured on the local site. This is by design — it keeps the suite green on minimal installs.

| Test | Skip Condition | Reason |
|---|---|---|
| **Variation Swatches** (image update, OOS) | `data-product_variations="[]"` | Variable product created via API has no variations configured |
| **Variable product ATC** (add-to-cart spec) | `button.single_add_to_cart_button` not found | WC doesn't render the ATC button with no variation data |
| **Wishlist** (active state, page, refresh) | Wishlist button present but no state change | Feature requires server-side session; may need account to persist |
| **Product Filter** (by category, price, pagination) | `li.product` not found on `/shop` | WowStore block grid uses custom markup; filter widget may not be on page |
| **Purchase Journey** (cart notification) | No cart notice element found | WowStore uses a fly-to-cart animation rather than `.woocommerce-message` |
| **Pre-Order** (button, countdown) | Pre-order product type not configured | Addon may not be enabled on this site |

> **Animation Flakiness Fix:** WowStore's Add to Cart button has CSS animation classes (`wopb-animation wopb-anim-click`) that cause Playwright's stability check to time out. All ATC button clicks use `{ force: true }` to bypass this. Variation `<select>` elements use `element.evaluate()` + `dispatchEvent('change')` for the same reason.

---

## CI/CD Integration

A ready-to-use GitHub Actions workflow is included at `.github/workflows/wowstore-e2e.yml`.

**Required GitHub Secrets:**

| Secret | Description |
|---|---|
| `WP_BASE_URL` | Your WordPress site URL |
| `WP_ADMIN_USER` | Admin username |
| `WP_ADMIN_PASSWORD` | Admin password |
| `WC_CONSUMER_KEY` | WooCommerce REST API consumer key |
| `WC_CONSUMER_SECRET` | WooCommerce REST API consumer secret |
| `WC_CUSTOMER_USER` | Shopper username |
| `WC_CUSTOMER_PASSWORD` | Shopper password |

The workflow runs smoke tests on every push/PR and the full regression suite on schedule.

---

## Troubleshooting

### Tests fail on the auth step

- Confirm `WP_BASE_URL`, `WP_ADMIN_USER`, `WP_ADMIN_PASSWORD` in `.env` are correct.
- Run `npx playwright test --headed` to watch the login page.
- Ensure the `playwright/.auth/` directory exists and is writable (it's gitignored).

### WooCommerce API returns 401

- The suite uses **cookie-based nonce auth** — no Application Passwords needed.
- Ensure your WordPress site is accessible at `WP_BASE_URL` and the admin credentials are correct.
- If the nonce fetch fails, check that `/wp-admin/admin-ajax.php` is accessible.

### `locator.click: Timeout` on Add to Cart button

- This is caused by the `wopb-animation wopb-anim-click` CSS classes making the button perpetually "unstable".
- All ATC clicks in this suite already use `{ force: true }` — if you write new tests, do the same.

### Block inserter search returns no WowStore blocks

- Confirm WowStore is **activated** and WooCommerce is also active.
- WowStore blocks are registered only when WC is active.

### Flaky tests in CI

- Increase `retries` in `playwright.config.ts` (currently `2` in CI).
- Add `waitForLoadState('networkidle')` for pages with heavy AJAX.

---

## Adding New Tests

1. Create a new `.spec.ts` file in the appropriate `tests/` subfolder.
2. Add the scenario definition to `tests/scenarios/`.
3. Import the relevant Page Object and/or utility helpers.
4. Tag tests with `@smoke` or `@regression`.
5. Use `test.beforeAll` to create test data via API; clean up in `test.afterAll`.

```typescript
import { test, expect } from '@playwright/test';
import { createProduct, deleteProduct } from '../../utils/woocommerce';

test.describe('My New Feature @regression', () => {
  let productId: number;

  test.beforeAll(async ({ request }) => {
    const p = await createProduct(request, { name: 'My Test Product' });
    productId = p.id;
  });

  test.afterAll(async ({ request }) => {
    await deleteProduct(request, productId);
  });

  test('Scenario: feature works as expected @regression', async ({ page }) => {
    await page.goto(`/product/my-test-product`);
    // ...
  });
});
```

---

*Maintained by the WowStore QA team · [SCENARIOS.md](./SCENARIOS.md) for full coverage report*
