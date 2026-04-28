// tests/scenarios/wishlist.scenarios.ts
// Gherkin scenarios for the WowStore Wishlist addon.
// Tags: @smoke @regression
//
// Context: Wishlist is a free/pro retention tool used by most stores.
// Enables shoppers to save products for later — key for fashion/lifestyle verticals.

import type { AnyScenario } from './index';

export const wishlistScenarios: AnyScenario[] = [
  {
    id: 'wishlist-add-product',
    title: 'Scenario: Shopper can add a product to the wishlist @smoke',
    tags: ['@smoke'],
    gherkin: `Feature: WowStore Wishlist

Scenario: Shopper can add a product to the wishlist
  Given the Wishlist addon is enabled in WowStore settings
  And a published product is visible on the shop or product page
  When the shopper clicks the wishlist heart icon on that product
  Then the heart icon changes to a filled/active state
  And a success notification or visual feedback confirms the addition`,
  },

  {
    id: 'wishlist-product-appears-on-page',
    title: 'Scenario: Added product appears on the Wishlist page @regression',
    tags: ['@regression'],
    gherkin: `Feature: WowStore Wishlist

Scenario: Added product appears on the Wishlist page
  Given the shopper has added a product to their wishlist
  When the shopper navigates to the /wishlist page
  Then the product is listed on the wishlist page
  And the product title and price are visible`,
  },

  {
    id: 'wishlist-persists-after-refresh',
    title: 'Scenario: Wishlist selection persists after page refresh @regression',
    tags: ['@regression'],
    gherkin: `Feature: WowStore Wishlist

Scenario: Wishlist selection persists after page refresh
  Given a shopper has added a product to their wishlist
  When the shopper refreshes the shop or product listing page
  Then the wishlist heart icon for that product is still in the filled/active state`,
  },

  {
    id: 'wishlist-remove-product',
    title: 'Scenario: Shopper can remove a product from the wishlist @regression',
    tags: ['@regression'],
    gherkin: `Feature: WowStore Wishlist

Scenario: Shopper can remove a product from the wishlist
  Given the shopper's wishlist contains exactly one product
  When the shopper removes it from the wishlist page
  Then the wishlist page displays an empty state message
  And the product is no longer listed`,
  },
];
