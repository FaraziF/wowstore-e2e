// tests/scenarios/preOrder.scenarios.ts
// Gherkin scenarios for the WowStore Pre-Order addon.
// Tags: @smoke @regression
//
// Context: Pre-Order is a Pro revenue feature for product launch campaigns.
// It replaces Add to Cart with a pre-order button and optional countdown timer.
//
// 💡 specFile: Cmd+Click (Mac) / Ctrl+Click (Win) the path to jump to the spec.

import type { AnyScenario } from './index';

export const preOrderScenarios: AnyScenario[] = [
  {
    id: 'preorder-button-replaces-atc',
    title: 'Scenario: Pre-order button replaces the Add to Cart button @smoke',
    tags: ['@smoke'],
    specFile: 'tests/addons/pre-order.spec.ts',
    gherkin: `Feature: WowStore Pre-Order

Scenario: Pre-order button replaces the Add to Cart button
  Given the Pre-Order addon is enabled in WowStore settings
  And a product is configured as a Pre-Order item with a future release date
  When a shopper visits that product's page
  Then the standard "Add to cart" button is NOT visible
  And a pre-order button (e.g. "Pre-Order Now") is displayed instead`,
  },

  {
    id: 'preorder-countdown-visible',
    title: 'Scenario: Countdown timer displays on a pre-order product page @regression',
    tags: ['@regression'],
    specFile: 'tests/addons/pre-order.spec.ts',
    gherkin: `Feature: WowStore Pre-Order

Scenario: Countdown timer displays on a pre-order product page
  Given a product is configured as Pre-Order with a release date set 7 days in the future
  And the countdown timer is enabled in Pre-Order settings
  When a shopper views the product page
  Then a countdown timer element is visible
  And it shows days/hours/minutes remaining until the release date`,
  },

  {
    id: 'preorder-can-be-purchased',
    title: 'Scenario: A pre-order product can be purchased through checkout @regression',
    tags: ['@regression'],
    specFile: 'tests/addons/pre-order.spec.ts',
    gherkin: `Feature: WowStore Pre-Order

Scenario: A pre-order product can be purchased through checkout
  Given a pre-order product exists with the pre-order button visible
  When a shopper clicks the pre-order button
  Then the product is added to the cart
  And the shopper can complete checkout successfully
  And the resulting order appears in WP admin > Orders`,
  },
];
