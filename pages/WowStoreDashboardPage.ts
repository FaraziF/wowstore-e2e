// pages/WowStoreDashboardPage.ts
// Page Object Model for the WowStore admin dashboard.

import type { Page, Locator } from '@playwright/test';

export class WowStoreDashboardPage {
  readonly page: Page;

  // ── Navigation ──────────────────────────────────────────────────────────
  readonly menuItem: Locator;
  readonly dashboardHeading: Locator;

  // ── Tab navigation ──────────────────────────────────────────────────────
  readonly tabs: Locator;
  readonly getTab: (name: string) => Locator;

  // ── Template / Starter pack section ─────────────────────────────────────
  readonly starterPacksSection: Locator;
  readonly importTemplateButtons: Locator;

  // ── Settings ────────────────────────────────────────────────────────────
  readonly saveSettingsButton: Locator;
  readonly successNotice: Locator;
  readonly errorNotice: Locator;

  constructor(page: Page) {
    this.page = page;

    this.menuItem           = page.locator('#adminmenu a[href*="wopb-settings"]').first();
    // WowStore renders a React SPA with no h1/h2; wait for the settings tab wrap
    this.dashboardHeading   = page.locator('.wopb-settings-tab-wrap, .wopb-setting-header').first();

    // Nav tabs: ul.wopb-settings-tab contains the anchor links
    this.tabs               = page.locator('.wopb-settings-tab a, ul.wopb-settings-tab li');
    this.getTab             = (name: string) => page.locator('.wopb-settings-tab a').filter({ hasText: name });

    // Template Kits section uses id="templatekit" as hash anchor
    this.starterPacksSection  = page.locator('#templatekit, [id*="template"], [class*="template-kit"]').first();
    this.importTemplateButtons = page.locator('button:has-text("Import"), a:has-text("Import")');

    this.saveSettingsButton = page.locator('input[type="submit"][value*="Save"], button:has-text("Save")').first();
    this.successNotice      = page.locator('.notice-success, .updated, .wopb-notice-success').first();
    this.errorNotice        = page.locator('.notice-error, .error').first();
  }

  /** Navigate directly to the WowStore dashboard. */
  async goto(): Promise<void> {
    // Correct admin page slug for WowStore is 'wopb-settings'
    await this.page.goto('/wp-admin/admin.php?page=wopb-settings');
    await this.page.waitForLoadState('networkidle');
  }

  /** Confirm the dashboard is visible. */
  async assertVisible(): Promise<void> {
    // WowStore renders a React SPA — wait for its settings tab container
    await this.page.locator('.wopb-settings-tab-wrap, .wopb-setting-header').first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Click a top-level dashboard tab by its label text. */
  async clickTab(label: string): Promise<void> {
    await this.getTab(label).click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Save the current settings form and wait for the success notice. */
  async saveSettings(): Promise<void> {
    await this.saveSettingsButton.click();
    await this.successNotice.waitFor({ state: 'visible', timeout: 10_000 });
  }
}
