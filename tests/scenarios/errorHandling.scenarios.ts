// tests/scenarios/errorHandling.scenarios.ts
// Gherkin-style scenario definitions for Error Handling tests.
// These scenarios verify that WowStore degrades gracefully when
// WooCommerce dependencies, data, or API conditions are abnormal.
//
// Tags: @error @smoke @regression

export type ErrorHandlingScenario = {
  id: string;
  title: string;
  tags: string[];
  gherkin: string;
};

export const errorHandlingScenarios: ErrorHandlingScenario[] = [
  // ── Dependency Errors ───────────────────────────────────────────────────────
  {
    id: 'wc-dependency-deactivated',
    title: 'Scenario: WowStore shows a dependency error when WooCommerce is deactivated @smoke @error',
    tags: ['@smoke', '@error'],
    gherkin: `Feature: WowStore Error Handling

Scenario: WowStore shows a dependency error when WooCommerce is deactivated
  Given I am authenticated in WordPress admin
  And WowStore and WooCommerce are both currently active
  When I deactivate WowStore first (required before WooCommerce can be deactivated)
  And I deactivate WooCommerce
  And I attempt to activate WowStore without WooCommerce being active
  Then WowStore should NOT activate successfully
  And an admin notice should appear indicating that WooCommerce is required
  When I re-activate WooCommerce
  And I re-activate WowStore
  Then WowStore should function normally again`,
  },

  {
    id: 'wc-version-below-minimum',
    title: 'Scenario: Admin notice shown when WooCommerce version is below minimum @regression @error',
    tags: ['@regression', '@error'],
    gherkin: `Feature: WowStore Error Handling

Scenario: Admin notice is shown when WooCommerce version is below minimum
  Given I am authenticated in WordPress admin
  And I navigate to the WowStore dashboard
  Then no "WooCommerce version" compatibility error notice should be visible
  And the dashboard should load without any version mismatch warnings`,
  },

  // ── Block Empty-State Errors ────────────────────────────────────────────────
  {
    id: 'block-empty-categories',
    title: 'Scenario: Product Category block renders gracefully when no categories exist @regression @error',
    tags: ['@regression', '@error'],
    gherkin: `Feature: WowStore Error Handling

Scenario: Product Category block renders gracefully when no categories exist
  Given I am authenticated in WordPress admin
  And all WooCommerce product categories have been removed
  When I create a new post and insert the "Product Category #1" block
  Then the block editor should NOT show a JavaScript error
  And the block should render an empty state or a placeholder message
  And I should NOT see a PHP warning or fatal error in the page`,
  },

  {
    id: 'block-empty-products',
    title: 'Scenario: Product block renders gracefully when no products exist @regression @error',
    tags: ['@regression', '@error'],
    gherkin: `Feature: WowStore Error Handling

Scenario: Product block renders gracefully when no products exist
  Given I am authenticated in WordPress admin
  And the WooCommerce store has no published products
  When I create a new post and insert a WowStore product block
  Then the block editor should NOT crash or show an error overlay
  And the block should render a "no products found" state on the frontend`,
  },

  // ── REST API / Data Errors ──────────────────────────────────────────────────
  {
    id: 'invalid-product-api-response',
    title: 'Scenario: REST API call with invalid product ID returns 404 not 500 @regression @error',
    tags: ['@regression', '@error'],
    gherkin: `Feature: WowStore Error Handling

Scenario: REST API call with an invalid product ID returns 404, not 500
  Given I am authenticated in WordPress admin
  When I send a GET request to "/wp-json/wc/v3/products/999999999"
  Then the response status code should be 404
  And the response body should contain a structured error message
  And the response should NOT return a 500 Internal Server Error`,
  },

  {
    id: 'rest-api-malformed-data',
    title: 'Scenario: Posting malformed data to WC REST API returns structured error not 500 @regression @error',
    tags: ['@regression', '@error'],
    gherkin: `Feature: WowStore Error Handling

Scenario: Posting malformed data to the WC REST API returns a structured error, not a 500
  Given I am authenticated in WordPress admin
  When I POST malformed data (missing required fields) to "/wp-json/wc/v3/products"
  Then the response status code should be 400 or 422
  And the response body should contain a human-readable error code and message
  And the server should NOT respond with a 500 Internal Server Error`,
  },

  // ── WooCommerce Page Integrity ──────────────────────────────────────────────
  {
    id: 'missing-wc-pages',
    title: 'Scenario: WooCommerce Shop, Cart and Checkout pages exist and are not 404 @smoke @error',
    tags: ['@smoke', '@error'],
    gherkin: `Feature: WowStore Error Handling

Scenario: WooCommerce Shop, Cart, and Checkout pages exist and are not 404
  Given WooCommerce is active with default page setup
  When I navigate to the Shop page URL
  Then the response should be 200, not 404
  When I navigate to the Cart page URL
  Then the response should be 200, not 404
  When I navigate to the Checkout page URL
  Then the response should be 200, not 404`,
  },
];
