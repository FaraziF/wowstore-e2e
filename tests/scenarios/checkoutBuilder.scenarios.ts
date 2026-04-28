// tests/scenarios/checkoutBuilder.scenarios.ts
// Gherkin scenarios for the WowStore custom Checkout Builder page.
// Tags: @smoke @regression
//
// Context: WowStore replaces the default WooCommerce checkout with a
// Gutenberg-built custom template. These tests verify that template
// renders correctly and that orders can be placed through it.

import type { AnyScenario } from './index';

export const checkoutBuilderScenarios: AnyScenario[] = [
  {
    id: 'checkout-template-loads',
    title: 'Scenario: WowStore custom checkout template loads on /checkout @smoke',
    tags: ['@smoke'],
    gherkin: `Feature: WowStore Checkout Builder

Scenario: WowStore custom checkout template loads on /checkout
  Given the WowStore custom Checkout Builder template is published and assigned
  And a shopper has at least one product in their cart
  When the shopper navigates to /checkout
  Then the page loads with HTTP 200
  And the billing address form is visible
  And the shipping address section is present
  And the order review/summary section is visible`,
  },

  {
    id: 'checkout-payment-methods-visible',
    title: 'Scenario: Payment method options are visible on the checkout page @smoke',
    tags: ['@smoke'],
    gherkin: `Feature: WowStore Checkout Builder

Scenario: Payment method options are visible on the checkout page
  Given the WowStore checkout template is active
  And a shopper has a product in their cart
  When the shopper visits /checkout
  Then at least one payment method option is displayed
  And the "Place order" button is visible`,
  },

  {
    id: 'checkout-order-placed',
    title: 'Scenario: A complete order can be placed through the WowStore checkout @regression',
    tags: ['@regression'],
    gherkin: `Feature: WowStore Checkout Builder

Scenario: A complete order can be placed through the WowStore checkout
  Given a shopper has a simple product in their cart
  And the WowStore checkout template is active
  When the shopper enters valid billing details:
    | Field           | Value         |
    | First Name      | E2E           |
    | Last Name       | Test          |
    | Address         | 123 Test St   |
    | City            | Testville     |
    | Postcode        | 12345         |
    | Email           | e2e@test.com  |
  And selects "Cash on delivery"
  And clicks "Place order"
  Then the shopper is redirected to the Thank You / Order Received page
  And the order number is displayed
  And the order exists in WP admin > Orders`,
  },

  {
    id: 'checkout-empty-cart-redirect',
    title: 'Scenario: Navigating to checkout with empty cart redirects to shop @regression',
    tags: ['@regression'],
    gherkin: `Feature: WowStore Checkout Builder

Scenario: Navigating to checkout with empty cart redirects to shop
  Given the shopper has an empty cart
  When the shopper navigates directly to /checkout
  Then they are redirected to the shop or cart page
  And a "your cart is empty" message is shown`,
  },
];
