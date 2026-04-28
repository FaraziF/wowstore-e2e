// tests/scenarios/backorder.scenarios.ts
// Gherkin scenarios for the WowStore Backorder addon.
// Tags: @smoke @regression
//
// Context: Backorder lets merchants keep taking orders when stock hits zero.
// Critical for physical goods stores — revenue stops during stockouts without it.
//
// 💡 specFile: Cmd+Click (Mac) / Ctrl+Click (Win) the path to jump to the spec.

import type { AnyScenario } from './index';

export const backorderScenarios: AnyScenario[] = [
  {
    id: 'backorder-button-visible-oos',
    title: 'Scenario: Add to cart button is available for out-of-stock backorder products @smoke',
    tags: ['@smoke'],
    specFile: 'tests/addons/backorder.spec.ts',
    gherkin: `Feature: WowStore Backorder

Scenario: Add to cart button is available for out-of-stock backorder products
  Given the Backorder addon is enabled in WowStore settings
  And a product has stock_quantity of 0 and backorders set to "yes"
  When a shopper visits that product page
  Then the "Add to cart" button is visible and enabled
  And no "Out of stock" label prevents adding to cart`,
  },

  {
    id: 'backorder-custom-label',
    title: 'Scenario: Custom backorder availability label is shown on the product page @regression',
    tags: ['@regression'],
    specFile: 'tests/addons/backorder.spec.ts',
    gherkin: `Feature: WowStore Backorder

Scenario: Custom backorder availability label is shown on the product page
  Given the Backorder addon has a custom availability text configured
  And a product is set to allow backorders
  When a shopper views the product page
  Then the custom backorder availability text is displayed near the stock status`,
  },

  {
    id: 'backorder-order-placed',
    title: 'Scenario: A backordered product can be purchased successfully @regression',
    tags: ['@regression'],
    specFile: 'tests/addons/backorder.spec.ts',
    gherkin: `Feature: WowStore Backorder

Scenario: A backordered product can be purchased successfully
  Given an out-of-stock product allows backorders
  When a shopper adds it to the cart and completes checkout
  Then the order is created in WP admin
  And the order line item shows the backordered product`,
  },
];
