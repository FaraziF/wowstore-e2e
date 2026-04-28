# WowStore E2E — Master AI Instruction File

> **For AI Assistants**: When working on any task in this project, follow this file completely.
> It consolidates all project conventions, architecture decisions, coding standards, and patterns
> established across `.github/playwright-typescript.instructions.md`,
> `.github/project-instructions.md`, `.github/wordpress-plugin-instructions.md`, and the README.

---

## 1. Project Overview

This is a **Playwright + TypeScript** end-to-end test suite for **WowStore – Store Builder & Product Blocks for WooCommerce**. It tests plugin activation, Gutenberg blocks, WooCommerce integration, admin dashboard, error handling, security, and frontend shopper flows.

- **Language**: TypeScript (all files use `.ts`)
- **Runner**: `@playwright/test` (v1.44+)
- **Execution**: Sequential, single worker — WordPress state is shared
- **Environment**: Local WordPress via `wp-env`, Local by Flywheel, or Docker

---

## 2. Directory Structure

```
wowstore-e2e/
├── playwright.config.ts          # Playwright config — DO NOT change workers/parallelism
├── package.json                  # npm scripts (see §8)
├── tsconfig.json
├── .env                          # Local secrets — never commit
├── .env.example                  # Template for .env
├── SCENARIOS.md                  # Auto-generated — do NOT edit manually
│
├── tests/
│   ├── setup/
│   │   ├── auth.setup.ts         # Admin auth state (runs first, always)
│   │   └── customer-auth.setup.ts
│   ├── plugin/
│   │   ├── plugin-activation.spec.ts
│   │   └── dashboard.spec.ts
│   ├── blocks/
│   │   ├── product-grid.spec.ts
│   │   └── product-category.spec.ts
│   ├── error-handling/           # Error & degradation tests
│   ├── security/                 # Auth, nonce, XSS tests
│   ├── wp/                       # WordPress core tests
│   ├── pom/                      # POM-based tests (blocks/, wp/ subdirs)
│   └── scenarios/                # Gherkin scenario registry (see §5)
│       ├── index.ts              # Central export — always import from here
│       ├── dashboard.scenarios.ts
│       ├── pluginActivation.scenarios.ts
│       ├── errorHandling.scenarios.ts
│       ├── productCategory.scenarios.ts
│       ├── productGrid.scenarios.ts
│       └── security.scenarios.ts
│
├── pages/                        # Page Object Models
│   ├── BlockEditorPage.ts
│   └── WowStoreDashboardPage.ts
│
├── utils/                        # Shared helpers
│   ├── wordpress.ts              # WP admin helpers, auth, Gutenberg utils
│   └── woocommerce.ts            # WC REST API helpers (nonce caching)
│
└── scripts/
    └── list-scenarios.ts         # Powers `npm run scenarios`
```

---

## 3. Environment Variables (`.env`)

**All URLs and credentials MUST come from `.env`. Never hard-code URLs in tests.**

```dotenv
WP_BASE_URL=http://localhost:8888   # No trailing slash
WP_ADMIN_USER=admin
WP_ADMIN_PASSWORD=password
WC_CONSUMER_KEY=ck_your_consumer_key
WC_CONSUMER_SECRET=cs_your_consumer_secret
WC_CUSTOMER_USER=customer
WC_CUSTOMER_PASSWORD=customer123
WP_CLI_PATH=wp
```

Access in code via `process.env.WP_BASE_URL` — `dotenv.config()` is called in `playwright.config.ts`.

---

## 4. Playwright Configuration Rules

These settings in `playwright.config.ts` are **fixed** — do not change them without explicit instruction:

| Setting | Value | Reason |
|---------|-------|--------|
| `workers` | `1` | WordPress state is shared; race conditions break tests |
| `fullyParallel` | `false` | Same reason |
| `actionTimeout` | `15 000 ms` | Gutenberg AJAX can be slow |
| `navigationTimeout` | `30 000 ms` | Page-load budget |
| `slowMo` | `1000 ms` | Admin project only — stabilises Gutenberg |
| `trace` | `on-first-retry` | Captures traces on first retry only |
| `screenshot` | `only-on-failure` | |
| `video` | `retain-on-failure` | |

### Projects

| Project | Scope | Auth |
|---------|-------|------|
| `setup` | `*.setup.ts` files | — |
| `chromium-admin` | All tests except `frontend/` | Admin cookie |
| `chromium-frontend` | `frontend/**` only | None (anonymous) |
| `firefox-smoke` | `@smoke` tagged tests | Admin cookie |

---

## 5. Gherkin / BDD Scenario Architecture

Every test scenario **must** be defined in `tests/scenarios/` **before** writing the spec file.

### Scenario File Shape

```typescript
// tests/scenarios/myFeature.scenarios.ts
import type { AnyScenario } from './index';

export const myFeatureScenarios: AnyScenario[] = [
  {
    id: 'my-feature-1',          // kebab-case, unique across the whole suite
    title: 'Short human title',  // used in CLI report
    tags: ['@smoke'],            // @smoke | @regression | @error | @security
    gherkin: `
      Given ...
      When  ...
      Then  ...
    `,
  },
];
```

### Registering a New Feature

1. Create `tests/scenarios/myFeature.scenarios.ts`
2. Add to `tests/scenarios/index.ts`:
   - Import: `import { myFeatureScenarios } from './myFeature.scenarios';`
   - Add to `SCENARIO_REGISTRY`: `'My Feature': myFeatureScenarios,`
   - Add re-export: `export { myFeatureScenarios } from './myFeature.scenarios';`
3. Run `npm run scenarios` to verify it appears in the report and regenerate `SCENARIOS.md`

### Importing Scenarios in Spec Files

```typescript
// Always import from the central index — never from individual scenario files directly
import { myFeatureScenarios } from '../scenarios';
```

---

## 6. TypeScript & Test Writing Standards

### Imports

```typescript
import { test, expect } from '@playwright/test';
// Page Objects
import { BlockEditorPage } from '../../pages/BlockEditorPage';
import { WowStoreDashboardPage } from '../../pages/WowStoreDashboardPage';
// Utilities
import { goToAdminPage, dismissAdminNotices } from '../../utils/wordpress';
import { createProduct, deleteProduct } from '../../utils/woocommerce';
// Scenarios (always from central index)
import { myFeatureScenarios } from '../scenarios';
```

### File Naming

| What | Convention | Example |
|------|-----------|---------|
| Spec files | `<feature>.spec.ts` | `product-grid.spec.ts` |
| Scenario files | `<feature>.scenarios.ts` | `productGrid.scenarios.ts` |
| Page Objects | `PascalCasePage.ts` | `BlockEditorPage.ts` |
| Utils | `camelCase.ts` | `woocommerce.ts` |
| Setup files | `<name>.setup.ts` | `auth.setup.ts` |

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wp-admin/...'); // use relative URLs — baseURL is set in config
  });

  test('scenario title from gherkin', async ({ page }) => {
    await test.step('Given: setup context', async () => {
      // ...
    });

    await test.step('When: user action', async () => {
      // ...
    });

    await test.step('Then: expected result', async () => {
      await expect(locator).toHaveText('...');
    });
  });
});
```

### Locator Priority (most → least preferred)

1. `getByRole('button', { name: 'Save' })` — semantic, accessible
2. `getByLabel('Email address')`
3. `getByText('Submit')`
4. `getByTestId('submit-btn')`
5. `locator('.wp-menu-name')` — WordPress-specific class (acceptable)
6. XPath — last resort for Gutenberg iframe internals only

### Assertion Rules

| Use | For |
|-----|-----|
| `toHaveText` / `toContainText` | Text content verification |
| `toHaveURL` | Post-navigation URL check |
| `toHaveCount` | Number of elements |
| `toBeVisible` | Only when testing visibility changes specifically |
| `toMatchAriaSnapshot` | Gutenberg block output / complex UI structure |
| `toBeLessThan` | Performance timing assertions |

**Always use auto-retrying web-first assertions (with `await`).**  
**Never use hard-coded `page.waitForTimeout()` waits.**

---

## 7. Page Object Models (POM)

### Existing POMs

#### `WowStoreDashboardPage` — `/wp-admin/admin.php?page=wowstore`

```typescript
import { WowStoreDashboardPage } from '../../pages/WowStoreDashboardPage';

const dashboard = new WowStoreDashboardPage(page);
await dashboard.goto();
await dashboard.assertVisible();
await dashboard.clickTab('Templates');
await dashboard.saveSettings();
```

#### `BlockEditorPage` — Gutenberg editor wrapper

```typescript
import { BlockEditorPage } from '../../pages/BlockEditorPage';

const editor = new BlockEditorPage(page);
await editor.gotoNewPage();
await editor.waitForReady();
await editor.setTitle('My Test Page');
await editor.insertBlock('Product Grid');      // searches inserter and inserts
await editor.publish();
const url = await editor.getViewUrl();
```

### Creating New POMs

- Place in `pages/PascalCasePage.ts`
- Constructor receives `Page` from Playwright
- Expose semantic methods, not raw selectors
- Use the `page` instance for all interactions

---

## 8. Utility Helpers

### `utils/wordpress.ts`

| Function | Description |
|----------|-------------|
| `goToAdminPage(page, path)` | Navigate to WP admin URL and wait for networkidle |
| `dismissAdminNotices(page)` | Click all `.notice-dismiss` buttons |
| `waitForBlockEditor(page)` | Wait for Gutenberg canvas to be interactive |
| `searchAndGetBlock(page, name)` | Open inserter, search, return first result locator |
| `publishPost(page)` | Click Publish, handle pre-publish panel |
| `createPageViaApi(request, title, content)` | Create WP page via REST API |
| `deletePostViaApi(request, postId)` | Delete a post/page via REST API |
| `getWpNonce(page)` | Extract WP REST nonce from current page |

### `utils/woocommerce.ts`

| Function | Description |
|----------|-------------|
| `createProduct(request, overrides)` | Create WC product via REST API |
| `createCategory(request, name)` | Create WC product category via REST API |
| `deleteProduct(request, productId)` | Permanently delete WC product |
| `deleteCategory(request, categoryId)` | Permanently delete WC category |
| `getShopUrl(request)` | Resolve WooCommerce shop page permalink |

**API-First Rule**: Always use API helpers (`request` fixture) to create and clean up test data. Only use UI for tests that explicitly cover UI behavior.

---

## 9. Tag System

Every scenario must have at least one tag. Tags are applied with the `@` prefix.

| Tag | Purpose | Run command |
|-----|---------|-------------|
| `@smoke` | Critical path; fast CI gate on every PR | `npm run test:smoke` |
| `@regression` | Full regression; run before every release | `npm run test:regression` |
| `@error` | Error handling and degradation tests | `npm run test:error` |
| `@security` | Auth, nonce, XSS, privilege tests | `npm run test:security` |

---

## 10. npm Scripts Reference

```bash
npm test                      # Run full suite
npm run test:headed           # Headed browser (watch mode)
npm run test:debug            # Debug mode
npm run test:ui               # Playwright UI mode (interactive)
npm run test:smoke            # @smoke tests only
npm run test:regression       # @regression tests only
npm run test:error            # @error tests in error-handling/
npm run test:security         # @security tests in security/
npm run test:plugin           # tests/plugin/
npm run test:blocks           # tests/blocks/
npm run test:frontend         # tests/frontend/ (anonymous shopper)
npm run test:woocommerce      # tests/woocommerce/
npm run scenarios             # Regenerate SCENARIOS.md CLI report
npm run report                # Open last HTML report
```

---

## 11. Data Management Patterns

### Creating & Cleaning Up Data

```typescript
test.describe('My Feature @regression', () => {
  let productId: number;

  test.beforeAll(async ({ request }) => {
    const product = await createProduct(request, {
      name: 'E2E Test Product',
      regular_price: '19.99',
    });
    productId = product.id;
  });

  test.afterAll(async ({ request }) => {
    await deleteProduct(request, productId);
  });

  test('feature works', async ({ page }) => {
    // ...
  });
});
```

### WooCommerce API Auth

The WC REST API uses **Application Passwords** (preferred) or the Basic Auth plugin. Keys come from `.env` as `WC_CONSUMER_KEY` / `WC_CONSUMER_SECRET`. The `utils/woocommerce.ts` helpers handle nonce caching automatically.

---

## 12. WordPress / Gutenberg Specifics

### Block Editor Interactions

```typescript
// Wait for editor to be ready before any interaction
await editor.waitForReady(); // uses BlockEditorPage POM

// Inserter search pattern (if not using POM)
await page.getByRole('button', { name: /toggle block inserter/i }).click();
await page.getByRole('searchbox', { name: /search for blocks/i }).fill('Product Grid');
await page.getByRole('option', { name: 'Product Grid' }).click();

// Wait for WC AJAX-heavy operations
await page.waitForResponse(r =>
  r.url().includes('wc-ajax') && r.status() === 200
);
```

### WooCommerce Dependency Check

- WowStore blocks are **only registered when WooCommerce is active**
- Always verify WC is active before block-related tests if the test environment is uncertain
- Tests that require WC should skip gracefully:

```typescript
test.skip(!process.env.WC_CONSUMER_KEY, 'WooCommerce credentials required');
```

### Admin Notices

Always call `dismissAdminNotices(page)` in `beforeEach` if your test page may have WP admin notices that overlap with interactive elements.

---

## 13. Error Handling & Skip Patterns

```typescript
// Skip when a feature/dependency is unavailable
test.skip(condition, 'Reason string');

// Skip entire describe block
test.describe('Pro Features', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'Firefox not supported');
  // ...
});

// WooCommerce version check
const wcVersion = await getWooCommerceVersion();
test.skip(wcVersion < '8.0', 'Requires WooCommerce 8.0+');
```

---

## 14. Security Testing Patterns

```typescript
// Unauthenticated REST API request
test('endpoint rejects unauthenticated requests', async ({ request }) => {
  const response = await request.get('/wp-json/wc/v3/products');
  expect(response.status()).toBe(401);
});

// Nonce validation
test('AJAX handler rejects invalid nonce', async ({ page }) => {
  const response = await page.request.post('/wp-admin/admin-ajax.php', {
    data: { action: 'wowstore_action', _wpnonce: 'invalid_nonce' },
  });
  const result = await response.json();
  expect(result.success).toBe(false);
});

// XSS sanitization
test('XSS payload in product name is escaped', async ({ page }) => {
  // Create product with XSS name via API, render block, assert no <script> in DOM
});
```

---

## 15. Performance Standards

| Page | Max Load Time |
|------|--------------|
| WowStore admin dashboard | 4 000 ms |
| General admin pages | 3 000 ms |
| Frontend shop page | 3 000 ms |

```typescript
test('page loads within budget', async ({ page }) => {
  const start = Date.now();
  await page.goto('/wp-admin/admin.php?page=wowstore');
  await page.waitForLoadState('networkidle');
  expect(Date.now() - start).toBeLessThan(4000);
});
```

---

## 16. CI / GitHub Actions

Tests run in `.github/workflows/`. Key points:

- Browser: `chromium` only for full suite; `firefox` for `@smoke` cross-browser check
- Install: `npx playwright install --with-deps chromium firefox`
- Secrets mapped to env: `WP_BASE_URL`, `WP_ADMIN_USER`, `WP_ADMIN_PASSWORD`
- Upload HTML report as artifact (`playwright-report/`, retention 14 days)
- Use `wp-env` for ephemeral WordPress in CI

---

## 17. Adding a New Test — Checklist

When asked to add or generate tests for a new feature, follow this exact sequence:

- [ ] **1. Scenario file**: Create `tests/scenarios/<feature>.scenarios.ts` with `AnyScenario[]`
- [ ] **2. Register**: Update `tests/scenarios/index.ts` (import + registry + re-export)
- [ ] **3. Spec file**: Create `tests/<area>/<feature>.spec.ts`
  - Import scenarios from `'../scenarios'` (central index)
  - Use `test.describe` + `test.beforeAll/beforeEach`
  - Create API test data in `beforeAll`, clean up in `afterAll`
  - Wrap logical steps in `test.step()`
  - Use POM methods or utility helpers — never raw navigation strings
  - All URLs are relative (baseURL is set in config)
- [ ] **4. Tags**: Every test has `@smoke` or `@regression` plus any relevant `@error`/`@security`
- [ ] **5. Run**: `npm run scenarios` to regenerate `SCENARIOS.md`
- [ ] **6. Verify**: `npm run test:smoke` (quick check) or target the new spec file

---

## 18. What NOT To Do

| ❌ Don't | ✅ Do Instead |
|---------|-------------|
| Hard-code `http://localhost:8888` | Use relative paths — baseURL is in config |
| `page.waitForTimeout(2000)` | Use Playwright auto-waiting / web-first assertions |
| Import from individual scenario files directly | Import from `'../scenarios'` (central index) |
| Edit `SCENARIOS.md` manually | Run `npm run scenarios` to regenerate it |
| Create new `.js` files | Everything must be `.ts` |
| Use `toBeVisible()` as default assertion | Use specific assertions (`toHaveText`, `toHaveURL`, etc.) |
| Skip cleanup of API-created test data | Always clean up in `afterAll` |
| Change `workers` or `fullyParallel` in config | WordPress requires sequential, single-worker execution |

---

*This file is the single source of truth for AI-assisted development in this repository.*  
*Last updated: 2026-04-27*
