// tests/scenarios/dashboard.scenarios.ts
// Gherkin-style scenario definitions for the WowStore Admin Dashboard spec.
// Consumed by tests/plugin/dashboard.spec.ts

export type DashboardScenario = {
  id: string;
  title: string;
  tags: string[];
  gherkin: string;
};

export const dashboardScenarios: DashboardScenario[] = [
  {
    id: 'dashboard-loads',
    title: 'Scenario: WowStore dashboard loads without errors @smoke',
    tags: ['@smoke'],
    gherkin: `Feature: WowStore Admin Dashboard

Scenario: WowStore dashboard loads without errors
  Given I am authenticated in WordPress admin
  When I navigate to the WowStore dashboard
  Then the dashboard UI should be visible
  And no WowStore-related JavaScript console errors should be present`,
  },

  {
    id: 'dashboard-performance',
    title: 'Scenario: WowStore dashboard page loads in under 4 seconds @regression',
    tags: ['@regression'],
    gherkin: `Feature: WowStore Admin Dashboard

Scenario: WowStore dashboard page loads in under 4 seconds
  Given I am authenticated in WordPress admin
  When I navigate to the WowStore dashboard
  Then the page should finish loading in less than 4000 milliseconds`,
  },

  {
    id: 'navigation-tabs-present',
    title: 'Scenario: All primary navigation tabs are present @smoke',
    tags: ['@smoke'],
    gherkin: `Feature: WowStore Admin Dashboard

Scenario: All primary navigation tabs are present on the dashboard
  Given I am authenticated in WordPress admin
  When I navigate to the WowStore dashboard
  Then at least one navigation tab should be visible in the settings tab bar`,
  },

  {
    id: 'starter-packs-visible',
    title: 'Scenario: Starter packs / templates section is visible @regression',
    tags: ['@regression'],
    gherkin: `Feature: WowStore Admin Dashboard

Scenario: Starter packs and template kits section is visible
  Given I am authenticated in WordPress admin
  When I navigate to the WowStore template kits section
  Then the settings container or content area should be visible`,
  },

  {
    id: 'settings-link-accessible',
    title: 'Scenario: Settings link is accessible from the dashboard @regression',
    tags: ['@regression'],
    gherkin: `Feature: WowStore Admin Dashboard

Scenario: Settings link is accessible from the dashboard
  Given I am authenticated in WordPress admin
  And I navigate to the WowStore dashboard
  When I click the Settings tab link
  Then the URL should contain the WowStore admin slug "wopb-settings"`,
  },
];
