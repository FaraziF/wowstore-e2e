// tests/scenarios/productFilter.scenarios.ts
// Gherkin scenarios for the WowStore Product Filter block.
// Tags: @smoke @regression
//
// Context: Product Filter had 6 bug fixes in the last 10 WowStore releases —
// highest regression risk of any feature. Changelog bugs include:
//   - Sub-category double click issue (4.4.7)
//   - Filter block Search result forbidden issue (4.4.4)
//   - Cart Filter block taxonomy result issue (4.3.7)
//   - Filter Block product sorting result issue (4.3.5)
//   - Pagination nonce conflict with cache plugins (4.4.1)
//
// 💡 specFile: Cmd+Click (Mac) / Ctrl+Click (Win) the path to jump to the spec.

import type { AnyScenario } from './index';

export const productFilterScenarios: AnyScenario[] = [
  {
    id: 'filter-by-category',
    title: 'Scenario: Filter by category narrows the product grid results @smoke',
    tags: ['@smoke'],
    specFile: 'tests/blocks/product-filter.spec.ts',
    gherkin: `Feature: WowStore Product Filter Block

Scenario: Filter by category narrows the product grid results
  Given a shop page has both Product Filter and Product Grid blocks
  And products exist in at least two distinct categories
  When a shopper selects one category in the filter
  Then only products belonging to that category are displayed
  And products from other categories are not visible`,
  },

  {
    id: 'filter-by-price-range',
    title: 'Scenario: Filter by price range excludes products outside the range @regression',
    tags: ['@regression'],
    specFile: 'tests/blocks/product-filter.spec.ts',
    gherkin: `Feature: WowStore Product Filter Block

Scenario: Filter by price range excludes products outside the range
  Given products with prices of $10, $50, and $100 exist
  And the shop page has a Price Range filter
  When the shopper sets the maximum price to $60
  Then products priced above $60 are not shown
  And products priced at or below $60 remain visible`,
  },

  {
    id: 'filter-multiple-criteria',
    title: 'Scenario: Multiple active filters combine with AND logic @regression',
    tags: ['@regression'],
    specFile: 'tests/blocks/product-filter.spec.ts',
    gherkin: `Feature: WowStore Product Filter Block

Scenario: Multiple active filters combine with AND logic
  Given a shop page with Category and Price Range filters
  When the shopper selects a category and applies a price max of $50
  Then only products matching BOTH the category AND the price range are shown`,
  },

  {
    id: 'filter-clear-resets-results',
    title: 'Scenario: Clearing all filters restores the full product list @regression',
    tags: ['@regression'],
    specFile: 'tests/blocks/product-filter.spec.ts',
    gherkin: `Feature: WowStore Product Filter Block

Scenario: Clearing all filters restores the full product list
  Given a filter is active and a subset of products is displayed
  When the shopper clicks "Clear" or removes all active filters
  Then all products are visible again`,
  },

  {
    id: 'filter-pagination-works',
    title: 'Scenario: Pagination works correctly after a filter is applied @regression',
    tags: ['@regression'],
    specFile: 'tests/blocks/product-filter.spec.ts',
    gherkin: `Feature: WowStore Product Filter Block

Scenario: Pagination works correctly after a filter is applied
  Given more than 6 products match the active category filter
  And the grid is set to show 6 per page
  When the shopper navigates to page 2 of the filtered results
  Then a new set of matching products is displayed
  And products from page 1 are no longer visible`,
  },
];
