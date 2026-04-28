// tests/scenarios/addToCart.scenarios.ts
// Gherkin scenarios for the Add to Cart frontend shopper flow.
// Tags: @smoke @regression

import type { AnyScenario } from './index';

export const addToCartScenarios: AnyScenario[] = [
  {
    id: 'atc-simple-product',
    title: 'Scenario: Simple product can be added to cart @smoke',
    tags: ['@smoke'],
    gherkin: `Feature: Add to Cart — Core Shopper Flow

Scenario: Simple product can be added to cart
  Given a published simple product exists in the store
  When a shopper visits the product page
  And clicks the "Add to cart" button
  Then a cart success notice is visible
  And the cart item count increments by 1`,
  },

  {
    id: 'atc-variable-requires-selection',
    title: 'Scenario: Variable product requires variation selection before Add to Cart @smoke',
    tags: ['@smoke'],
    gherkin: `Feature: Add to Cart — Core Shopper Flow

Scenario: Variable product requires variation selection before Add to Cart
  Given a published variable product with Size and Color attributes exists
  When a shopper visits the product page without selecting a variation
  And tries to click "Add to cart"
  Then a variation-required error message is displayed
  And no item is added to the cart`,
  },

  {
    id: 'atc-variable-with-selection',
    title: 'Scenario: Variable product can be added to cart after variation selection @regression',
    tags: ['@regression'],
    gherkin: `Feature: Add to Cart — Core Shopper Flow

Scenario: Variable product can be added to cart after variation selection
  Given a published variable product with at least one variation exists
  When a shopper selects a valid variation on the product page
  And clicks "Add to cart"
  Then a cart success notice is visible
  And the cart contains the correct variation`,
  },

  {
    id: 'atc-quantity-increment',
    title: 'Scenario: Shopper can increase quantity before adding to cart @regression',
    tags: ['@regression'],
    gherkin: `Feature: Add to Cart — Core Shopper Flow

Scenario: Shopper can increase quantity before adding to cart
  Given a published simple product exists
  When a shopper visits the product page
  And changes the quantity input to 3
  And clicks "Add to cart"
  Then the cart shows 3 units of that product`,
  },

  {
    id: 'atc-cart-count-updates',
    title: 'Scenario: Cart item count in header updates after adding a product @smoke',
    tags: ['@smoke'],
    gherkin: `Feature: Add to Cart — Core Shopper Flow

Scenario: Cart item count in header updates after adding a product
  Given a shopper is on a product page with an empty cart
  When they add 1 product to the cart
  Then the mini-cart icon or count badge shows "1"`,
  },
];
