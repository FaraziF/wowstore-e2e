// tests/scenarios/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central registry of ALL Gherkin scenarios in this test suite.
//
// WHY THIS FILE EXISTS:
//   • Single import point for spec files — no need to hunt for scenario files.
//   • Powers the `npm run scenarios` CLI report.
//   • Makes it easy to see every covered scenario at a glance.
//
// HOW TO ADD A NEW FEATURE:
//   1. Create  tests/scenarios/myFeature.scenarios.ts
//   2. Add an entry to SCENARIO_REGISTRY below.
//   3. Done — it will appear in `npm run scenarios` output automatically.
// ─────────────────────────────────────────────────────────────────────────────

// ── Phase 1 — Foundation ─────────────────────────────────────────────────────
import { productCategoryScenarios }  from './productCategory.scenarios';
import { pluginActivationScenarios } from './pluginActivation.scenarios';
import { dashboardScenarios }        from './dashboard.scenarios';
import { errorHandlingScenarios }    from './errorHandling.scenarios';
import { securityScenarios }         from './security.scenarios';

// ── Phase 2 — Core Commerce & Revenue Path ───────────────────────────────────
import { addToCartScenarios }        from './addToCart.scenarios';
import { purchaseJourneyScenarios }  from './purchaseJourney.scenarios';
import { checkoutBuilderScenarios }  from './checkoutBuilder.scenarios';
import { variationSwatchesScenarios } from './variationSwatches.scenarios';
import { productFilterScenarios }    from './productFilter.scenarios';
import { backorderScenarios }        from './backorder.scenarios';
import { wishlistScenarios }         from './wishlist.scenarios';
import { preOrderScenarios }         from './preOrder.scenarios';

// ── Type that every scenario file must satisfy ────────────────────────────────
/**
 * AnyScenario — one Gherkin scenario entry.
 *
 * @field specFile  Relative path to the Playwright spec that implements this
 *                  scenario. Ctrl+Click (Mac: Cmd+Click) the path string in
 *                  VS Code to jump directly to the test file.
 */
export type AnyScenario = {
  id: string;
  /** Playwright test title (include tags, e.g. @smoke) */
  title: string;
  tags: string[];
  gherkin: string;
  /** Relative path to the spec file — Cmd+Click to navigate in VS Code */
  specFile: string;
};

// ── Registry ─────────────────────────────────────────────────────────────────
export const SCENARIO_REGISTRY: Record<string, AnyScenario[]> = {
  // Phase 1 — Foundation
  'Product Category Blocks': productCategoryScenarios.map(s => ({
    ...s,
    // productCategoryScenarios use a slightly different shape — normalise tags
    tags: s.title.match(/@\w+/g) ?? [],
    specFile: s.specFile,
  })),
  'Plugin Activation':  pluginActivationScenarios,
  'Admin Dashboard':    dashboardScenarios,
  'Error Handling':     errorHandlingScenarios,
  'Security':           securityScenarios,

  // Phase 2 — Core Commerce & Revenue Path
  'Add to Cart':            addToCartScenarios,
  'Purchase Journey':       purchaseJourneyScenarios,
  'Checkout Builder':       checkoutBuilderScenarios,
  'Variation Swatches':     variationSwatchesScenarios,
  'Product Filter Block':   productFilterScenarios,
  'Backorder':              backorderScenarios,
  'Wishlist':               wishlistScenarios,
  'Pre-Order':              preOrderScenarios,
};

// ── Convenience: flat list of every scenario ──────────────────────────────────
export const allScenarios: AnyScenario[] = Object.values(SCENARIO_REGISTRY).flat();

// ── Re-exports (so spec files can import from one place) ──────────────────────
// Phase 1
export { productCategoryScenarios }  from './productCategory.scenarios';
export { pluginActivationScenarios } from './pluginActivation.scenarios';
export { dashboardScenarios }        from './dashboard.scenarios';
export { errorHandlingScenarios }    from './errorHandling.scenarios';
export { securityScenarios }         from './security.scenarios';

// Phase 2
export { addToCartScenarios }        from './addToCart.scenarios';
export { purchaseJourneyScenarios }  from './purchaseJourney.scenarios';
export { checkoutBuilderScenarios }  from './checkoutBuilder.scenarios';
export { variationSwatchesScenarios } from './variationSwatches.scenarios';
export { productFilterScenarios }    from './productFilter.scenarios';
export { backorderScenarios }        from './backorder.scenarios';
export { wishlistScenarios }         from './wishlist.scenarios';
export { preOrderScenarios }         from './preOrder.scenarios';
