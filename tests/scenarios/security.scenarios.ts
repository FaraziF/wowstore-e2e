// tests/scenarios/security.scenarios.ts
// Gherkin-style scenario definitions for Security tests.
// These scenarios verify that WowStore and WooCommerce REST endpoints
// enforce proper authentication, authorization, nonce validation,
// and output sanitization against common web security threats.
//
// Tags: @security @smoke @regression
//
// 💡 specFile: Cmd+Click (Mac) / Ctrl+Click (Win) the path to jump to the spec.

export type SecurityScenario = {
  id: string;
  title: string;
  tags: string[];
  gherkin: string;
  /** Relative path to the spec file — Cmd+Click to navigate in VS Code */
  specFile: string;
};

export const securityScenarios: SecurityScenario[] = [
  // ── Authentication & Unauthenticated Access ─────────────────────────────────
  {
    id: 'unauth-wc-products-api',
    title: 'Scenario: Unauthenticated request to WC REST products endpoint is rejected @smoke @security',
    tags: ['@smoke', '@security'],
    specFile: 'tests/security/security.spec.ts',
    gherkin: `Feature: WowStore Security

Scenario: Unauthenticated request to the WC REST products endpoint is rejected
  Given I am NOT authenticated (anonymous user)
  When I send a GET request to "/wp-json/wc/v3/products"
  Then the response status code should be 401 or 403
  And the response body should contain a "woocommerce_rest_cannot_view" or similar error code
  And the response should NOT contain any product data`,
  },

  {
    id: 'unauth-wowstore-ajax',
    title: 'Scenario: Anonymous call to a WowStore admin-ajax action is rejected @smoke @security',
    tags: ['@smoke', '@security'],
    specFile: 'tests/security/security.spec.ts',
    gherkin: `Feature: WowStore Security

Scenario: Anonymous call to a WowStore admin-ajax action is rejected
  Given I am NOT authenticated (anonymous user)
  When I POST to "/wp-admin/admin-ajax.php" with a WowStore admin action
  Then the response should return "0", "-1", or a 400/403 HTTP status
  And the server should NOT perform any privileged operation`,
  },

  // ── Privilege Escalation ────────────────────────────────────────────────────
  {
    id: 'customer-privilege-escalation',
    title: 'Scenario: Customer-role user cannot access admin WC REST endpoints @regression @security',
    tags: ['@regression', '@security'],
    specFile: 'tests/security/security.spec.ts',
    gherkin: `Feature: WowStore Security

Scenario: A customer-role user cannot access admin-only WC REST endpoints
  Given I am authenticated as a customer (shop customer role)
  When I send a GET request to "/wp-json/wc/v3/orders" with customer credentials
  Then the response status code should be 403
  And the response body should contain an "unauthorized" error code
  And no order data belonging to other customers should be returned`,
  },

  // ── CSRF / Nonce Validation ─────────────────────────────────────────────────
  {
    id: 'nonce-validation',
    title: 'Scenario: WowStore AJAX request without a valid nonce is rejected @regression @security',
    tags: ['@regression', '@security'],
    specFile: 'tests/security/security.spec.ts',
    gherkin: `Feature: WowStore Security

Scenario: A WowStore AJAX request without a valid nonce is rejected
  Given I am authenticated in WordPress admin
  When I POST to "/wp-admin/admin-ajax.php" with a WowStore action but NO nonce header
  Then the response should return "0", "-1", or HTTP 400/403
  And the operation should NOT be executed on the server`,
  },

  // ── XSS / Output Sanitization ───────────────────────────────────────────────
  {
    id: 'xss-in-product-name',
    title: 'Scenario: Product with XSS payload in name is safely escaped in the block frontend @regression @security',
    tags: ['@regression', '@security'],
    specFile: 'tests/security/security.spec.ts',
    gherkin: `Feature: WowStore Security

Scenario: A product with an XSS payload in its name is safely escaped in the block frontend
  Given I am authenticated in WordPress admin
  And a WooCommerce product exists with name '<script>alert("XSS")</script> Test Product'
  When I create a post with a WowStore product block and publish it
  And I visit the post on the frontend as an anonymous user
  Then the page HTML should NOT contain an unescaped "<script>alert" string
  And the product name should be rendered as escaped text, not executed as a script`,
  },

  {
    id: 'xss-in-block-attribute',
    title: 'Scenario: HTML injected into a block heading attribute is sanitized in frontend render @regression @security',
    tags: ['@regression', '@security'],
    specFile: 'tests/security/security.spec.ts',
    gherkin: `Feature: WowStore Security

Scenario: HTML injected into a block heading attribute is sanitized on the frontend
  Given I am authenticated in WordPress admin
  When I insert a WowStore Product Category block and set the heading to '<img src=x onerror=alert(1)>'
  And I publish the post
  And I visit the post on the frontend as an anonymous user
  Then the heading should NOT execute any JavaScript
  And the rendered HTML should contain the escaped attribute or plain text only`,
  },

  // ── Sensitive Data Exposure ──────────────────────────────────────────────────
  {
    id: 'sensitive-data-not-exposed',
    title: 'Scenario: Sensitive admin data is NOT exposed in unauthenticated REST responses @regression @security',
    tags: ['@regression', '@security'],
    specFile: 'tests/security/security.spec.ts',
    gherkin: `Feature: WowStore Security

Scenario: Sensitive admin data is NOT exposed in unauthenticated REST responses
  Given I am NOT authenticated (anonymous user)
  When I send a GET request to "/wp-json/wp/v2/users"
  Then the response should NOT contain any admin email addresses
  And the response should NOT contain password hashes or API keys
  When I send a GET request to "/wp-json/wc/v3/settings"
  Then the response status code should be 401 or 403
  And no WooCommerce API keys or secret tokens should be visible`,
  },
];
