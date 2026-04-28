// tests/scenarios/pluginActivation.scenarios.ts
// Gherkin-style scenario definitions for the WowStore Plugin Activation spec.
// Consumed by tests/plugin/plugin-activation.spec.ts
//
// 💡 HOW TO NAVIGATE: Cmd+Click (Mac) the {@link} path in the @see JSDoc comment
//    above each scenario to jump directly to the spec file in VS Code.

export type PluginActivationScenario = {
  id: string;
  title: string;
  tags: string[];
  gherkin: string;
  /** Relative path to the spec file — Cmd+Click to navigate in VS Code */
  specFile: string;
};

export const pluginActivationScenarios: PluginActivationScenario[] = [

  /**
   * @see {@link ../plugin/plugin-activation.spec.ts}
   */
  {
    id: 'plugin-listed',
    title: 'Scenario: WowStore plugin is listed in the plugins page @smoke',
    tags: ['@smoke'],
    specFile: 'tests/plugin/plugin-activation.spec.ts',
    gherkin: `Feature: WowStore Plugin Activation

Scenario: WowStore plugin is listed in the plugins page
  Given I am authenticated in WordPress admin
  When I navigate to the Plugins page
  Then the WowStore plugin row should be visible
  And the row should contain the text "WowStore"`,
  },

  /**
   * @see {@link ../plugin/plugin-activation.spec.ts}
   */
  {
    id: 'plugin-deactivate-reactivate',
    title: 'Scenario: WowStore plugin can be deactivated and re-activated @smoke',
    tags: ['@smoke'],
    specFile: 'tests/plugin/plugin-activation.spec.ts',
    gherkin: `Feature: WowStore Plugin Activation

Scenario: WowStore plugin can be deactivated and re-activated
  Given I am authenticated in WordPress admin
  And I navigate to the Plugins page
  When the plugin is currently active
  And I click the Deactivate link
  And I dismiss the deactivation feedback modal if it appears
  Then a deactivation success notice should be visible
  And the Activate link should be present
  When I click the Activate link
  Then the plugin is activated successfully
  And the Deactivate link should be present on the plugins page`,
  },

  /**
   * @see {@link ../plugin/plugin-activation.spec.ts}
   */
  {
    id: 'no-fatal-errors',
    title: 'Scenario: No fatal PHP errors appear after activation @regression',
    tags: ['@regression'],
    specFile: 'tests/plugin/plugin-activation.spec.ts',
    gherkin: `Feature: WowStore Plugin Activation

Scenario: No fatal PHP errors appear after activation
  Given I am authenticated in WordPress admin
  And I navigate to the Plugins page
  Then no PHP fatal or critical error notice should be visible`,
  },

  /**
   * @see {@link ../plugin/plugin-activation.spec.ts}
   */
  {
    id: 'admin-menu-visible',
    title: 'Scenario: WowStore admin menu item appears after activation @smoke',
    tags: ['@smoke'],
    specFile: 'tests/plugin/plugin-activation.spec.ts',
    gherkin: `Feature: WowStore Plugin Activation

Scenario: WowStore admin menu item appears after activation
  Given I am authenticated in WordPress admin
  And I navigate to the Plugins page
  Then the WowStore item should be visible in the WordPress admin menu`,
  },

  /**
   * @see {@link ../plugin/plugin-activation.spec.ts}
   */
  {
    id: 'woocommerce-dependency-not-shown',
    title: 'Scenario: WooCommerce dependency notice is NOT shown when WC is active @regression',
    tags: ['@regression'],
    specFile: 'tests/plugin/plugin-activation.spec.ts',
    gherkin: `Feature: WowStore Plugin Activation

Scenario: WooCommerce dependency notice is NOT shown when WC is active
  Given I am authenticated in WordPress admin
  And I navigate to the Plugins page
  Then no WooCommerce dependency or "requires WooCommerce" notice should be visible`,
  },
];
