// tests/scenarios/purchaseJourney.scenarios.ts
// Gherkin scenarios for the full end-to-end revenue-critical purchase path.
// Tags: @smoke
//
// This path maps the complete shopper journey:
//   Browse → Filter → Discover → Decide → Add → Review → Checkout → Confirm
//
// 💡 specFile: Cmd+Click (Mac) / Ctrl+Click (Win) the path to jump to the spec.

import type { AnyScenario } from './index';

export const purchaseJourneyScenarios: AnyScenario[] = [
  {
    id: 'journey-browse-to-cart',
    title: 'Scenario: Shopper can browse products and add one to cart @smoke',
    tags: ['@smoke'],
    specFile: 'tests/frontend/purchase-journey.spec.ts',
    gherkin: `Feature: End-to-End Purchase Journey

Scenario: Shopper can browse products and add one to cart
  Given published products exist in the store
  When an anonymous shopper visits the shop page
  Then product cards are displayed in the grid
  When the shopper clicks "Add to cart" on the first product
  Then the cart count increments
  And a success message is shown`,
  },

  {
    id: 'journey-cart-to-checkout',
    title: 'Scenario: Shopper can proceed from cart to WowStore checkout @smoke',
    tags: ['@smoke'],
    specFile: 'tests/frontend/purchase-journey.spec.ts',
    gherkin: `Feature: End-to-End Purchase Journey

Scenario: Shopper can proceed from cart to WowStore checkout
  Given a shopper has a product in their cart
  When the shopper views the cart page
  Then the product line item is visible with title and price
  When the shopper clicks "Proceed to checkout"
  Then the WowStore custom checkout page loads
  And the billing address section is visible
  And the order summary section is visible`,
  },

  {
    id: 'journey-full-order-placement',
    title: 'Scenario: Shopper can complete a full order on the WowStore checkout @smoke',
    tags: ['@smoke'],
    specFile: 'tests/frontend/purchase-journey.spec.ts',
    gherkin: `Feature: End-to-End Purchase Journey

Scenario: Shopper can complete a full order on the WowStore checkout
  Given a shopper has a product in their cart
  And the WowStore custom checkout template is active
  When the shopper fills in valid billing details
  And selects "Cash on delivery" payment
  And clicks "Place order"
  Then an order confirmation page is shown
  And an order number is visible
  And the order appears in the WordPress admin Orders list`,
  },
];
