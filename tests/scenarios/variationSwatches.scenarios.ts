// tests/scenarios/variationSwatches.scenarios.ts
// Gherkin scenarios for the WowStore built-in Variation Swatches addon.
// Tags: @smoke @regression
//
// Context: Uses WowStore's built-in swatches (not a third-party plugin).
// Changelog shows 4 regression fixes in last 10 releases — high-risk area.

import type { AnyScenario } from './index';

export const variationSwatchesScenarios: AnyScenario[] = [
  {
    id: 'swatches-replace-dropdown',
    title: 'Scenario: Color attribute is displayed as swatches instead of a dropdown @smoke',
    tags: ['@smoke'],
    gherkin: `Feature: WowStore Variation Swatches

Scenario: Color attribute is displayed as swatches instead of a dropdown
  Given the Variation Swatches addon is enabled in WowStore settings
  And a variable product has a "Color" attribute configured as swatches
  When a shopper views the single product page
  Then color swatch buttons are visible
  And no raw <select> dropdown is shown for the Color attribute`,
  },

  {
    id: 'swatches-selection-updates-image',
    title: 'Scenario: Selecting a color swatch updates the product image @regression',
    tags: ['@regression'],
    gherkin: `Feature: WowStore Variation Swatches

Scenario: Selecting a color swatch updates the product image
  Given a variable product has color swatches and variation-specific images
  When a shopper clicks a swatch for "Blue"
  Then the main product image updates to the Blue variation image
  And the selected swatch appears highlighted/active`,
  },

  {
    id: 'swatches-oos-disabled',
    title: 'Scenario: Out-of-stock variation swatch is visually disabled @regression',
    tags: ['@regression'],
    gherkin: `Feature: WowStore Variation Swatches

Scenario: Out-of-stock variation swatch is visually disabled
  Given a variable product has one variation that is out of stock
  When the shopper views the product page
  Then the out-of-stock swatch has a disabled or strikethrough visual state
  And clicking that swatch does not add the product to the cart`,
  },

  {
    id: 'swatches-size-type',
    title: 'Scenario: Size attribute is displayed as label swatches @regression',
    tags: ['@regression'],
    gherkin: `Feature: WowStore Variation Swatches

Scenario: Size attribute is displayed as label swatches
  Given the Variation Swatches addon is enabled
  And a variable product has a "Size" attribute configured as label swatches
  When a shopper views the product page
  Then size labels (S, M, L, XL) are shown as clickable buttons
  And selecting a size enables the "Add to cart" button`,
  },
];
