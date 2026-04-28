// pages/BlockEditorPage.ts
// Page Object Model for Gutenberg block editor interactions,
// specifically tailored to WowStore product blocks.

import type { Page, Locator } from '@playwright/test';

export class BlockEditorPage {
  readonly page: Page;

  // ── Editor chrome ────────────────────────────────────────────────────────
  readonly editorCanvas: Locator;
  // Modern WP 6.x: top-left "+" button has aria-label="Block Inserter"
  readonly inserterToggle: Locator;
  // Modern WP 6.x search input inside the inserter drawer
  readonly blockSearchInput: Locator;
  readonly publishButton: Locator;
  readonly confirmPublishButton: Locator;
  readonly postTitleInput: Locator;
  readonly previewButton: Locator;

  // ── Inspector sidebar ────────────────────────────────────────────────────
  readonly inspectorPanel: Locator;
  readonly inspectorToggle: Locator;

  constructor(page: Page) {
    this.page = page;

    this.editorCanvas        = page.locator('.block-editor-writing-flow, .editor-styles-wrapper');
    this.inserterToggle      = page.locator(
      'button[aria-label="Block Inserter"], ' +
      'button.edit-post-header-toolbar__inserter-toggle, ' +
      'button[aria-label*="Block Inserter"], ' +
      'button[aria-label*="Add block"]'
    ).first();
    this.blockSearchInput    = page.locator(
      'input[placeholder*="Search"], ' +
      'input.block-editor-inserter__search-input'
    ).first();
    this.publishButton       = page.locator('button.editor-post-publish-button, button:has-text("Publish"), button:has-text("Update")').first();
    this.confirmPublishButton= page.locator('button.editor-post-publish-button__button:has-text("Publish")');
    this.postTitleInput      = page.locator('h1.wp-block[data-type="core/post-title"], textarea#post-title-0, [aria-label="Add title"]').first();
    this.previewButton       = page.locator(
      'button[aria-label="Preview"], ' +
      'button[aria-label*="Preview"], ' +
      'button:has-text("Preview")'
    ).first();

    this.inspectorPanel      = page.locator('.block-editor-block-inspector, .edit-post-sidebar');
    this.inspectorToggle     = page.locator('button[aria-label="Settings"]').first();
  }

  /** Go to new-page editor. */
  async gotoNewPage(): Promise<void> {
    await this.page.goto('/wp-admin/post-new.php?post_type=page');
    await this.waitForReady();
  }

  /** Wait until the Gutenberg editor is fully interactive. */
  async waitForReady(): Promise<void> {
    await this.editorCanvas.waitFor({ state: 'visible', timeout: 30_000 });
    // Wait for initial loading spinners to vanish
    await this.page.waitForSelector('.components-spinner', { state: 'detached', timeout: 20_000 }).catch(() => {});
  }

  /** Set the page/post title. */
  async setTitle(title: string): Promise<void> {
    await this.postTitleInput.click();
    await this.postTitleInput.fill(title);
  }

  /**
   * Open the block inserter, search for `blockName`, and click the first result.
   * @param blockName  Partial name shown in the inserter
   */
  async insertBlock(blockName: string): Promise<void> {
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const normalized = blockName.replace(/\s+/g, ' ').trim();
    const withoutSuffix = normalized.replace(/\s*#\d+\s*$/i, '').trim();
    const candidates = [normalized, withoutSuffix].filter(Boolean);

    // Ensure inserter is open
    const expanded = await this.inserterToggle.getAttribute('aria-expanded');
    if (expanded !== 'true') await this.inserterToggle.click();

    await this.blockSearchInput.fill(withoutSuffix || normalized);
    await this.page.waitForTimeout(600); // allow debounced search

    // Click the first matching block result (WP labels vary, e.g. "Product Category" vs "Product Category #1")
    let result = this.page.locator(
      '.block-editor-block-types-list__item, [class*="block-types-list"] [role="option"], [class*="block-types-list"] button'
    );
    for (const name of candidates) {
      const rx = new RegExp(escapeRegExp(name), 'i');
      const match = result.filter({ hasText: rx }).first();
      if (await match.isVisible({ timeout: 1_500 }).catch(() => false)) {
        result = match;
        break;
      }
    }

    await result.first().waitFor({ state: 'visible', timeout: 10_000 });
    await result.first().click();

    // Close inserter
    await this.inserterToggle.click().catch(() => {});
    await this.page.waitForTimeout(400);
  }

  /**
   * Select a WowStore block already in the canvas by its block type data attribute.
   * @param blockType  e.g. 'product-blocks/product-grid'
   */
  async selectBlock(blockType: string): Promise<Locator> {
    const block = this.page.locator(`[data-type="${blockType}"]`).first();
    await block.click();
    return block;
  }

  /** Open the block inspector sidebar if not already open. */
  async openInspector(): Promise<void> {
    const visible = await this.inspectorPanel.isVisible();
    if (!visible) await this.inspectorToggle.click();
  }

  /**
   * Set a sidebar panel toggle (checkbox/toggle control) by its label.
   * @param label
   * @param enable
   */
  async setToggle(label: string, enable: boolean): Promise<void> {
    const toggle = this.page.locator(`label:has-text("${label}") input[type="checkbox"], ` +
      `[aria-label="${label}"] input[type="checkbox"]`).first();
    const isChecked = await toggle.isChecked();
    if (enable !== isChecked) await toggle.click();
  }

  /** Publish the post and wait for confirmation. */
  async publish(): Promise<void> {
    await this.publishButton.waitFor({ state: 'visible', timeout: 15_000 });
    await this.publishButton.click();

    const prePublishPanel = this.page.locator('.editor-post-publish-panel, .edit-post-post-publish-panel').first();

    // Gutenberg often requires a second confirmation click ("Publish" again) in a panel.
    for (let i = 0; i < 4; i++) {
      const panelOpen = await prePublishPanel.isVisible({ timeout: 1_500 }).catch(() => false);
      const confirmBtn =
        this.page.locator('.editor-post-publish-panel button:has-text("Publish"), .edit-post-post-publish-panel button:has-text("Publish")').first()
          .or(this.confirmPublishButton);

      const needsConfirm = (await confirmBtn.isVisible({ timeout: 1_500 }).catch(() => false)) || panelOpen;
      if (!needsConfirm) break;

      if (await confirmBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await confirmBtn.click();
        await this.page.waitForTimeout(350);
      } else {
        break;
      }
    }

    // Wait for save completion using UI signals (WP may not navigate).
    const viewLink = this.page.locator('a:has-text("View Page"), a:has-text("View Post")').first();
    const snackbar = this.page.locator('.components-snackbar__content').filter({ hasText: /published|updated/i }).first();

    await Promise.race([
      viewLink.waitFor({ state: 'visible', timeout: 30_000 }),
      snackbar.waitFor({ state: 'visible', timeout: 30_000 }),
      this.page
        .getByRole('button', { name: /update/i })
        .first()
        .waitFor({ state: 'visible', timeout: 30_000 }),
    ]).catch(async () => {
      // As a fallback, wait for network to settle after publish attempts.
      await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    });
  }

  /**
   * Open the WP editor Preview (usually "Preview in new tab") and return the popup Page.
   * Works for drafts and published pages (WP still uses the preview flow).
   */
  async preview(): Promise<Page> {
    await this.previewButton.waitFor({ state: 'visible', timeout: 10_000 });

    const popupPromise = this.page.waitForEvent('popup', { timeout: 20_000 });
    await this.previewButton.click();

    // WP shows either a dropdown menu item or a direct "Preview in new tab" button
    const previewInNewTab = this.page
      .getByRole('menuitem', { name: /preview in new tab/i })
      .or(this.page.getByRole('button', { name: /preview in new tab/i }))
      .first();

    if (await previewInNewTab.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await previewInNewTab.click();
      return popupPromise;
    }

    // Fallback: sometimes clicking "Preview" directly opens the popup.
    const popup = await popupPromise.catch(async () => {
      // Last resort: open the published URL (if available) in a new tab.
      const viewUrl = await this.getViewUrl();
      if (!viewUrl) throw new Error('Preview popup did not open and "View Page" link was not found.');
      const newTab = await this.page.context().newPage();
      await newTab.goto(viewUrl, { waitUntil: 'domcontentloaded' });
      return newTab;
    });

    return popup;
  }

  /** Return the published post's frontend URL from the editor toolbar. */
  async getViewUrl(): Promise<string | null> {
    const viewLink = this.page.locator('a:has-text("View Page"), a:has-text("View Post")').first();
    await viewLink.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
    return viewLink.getAttribute('href');
  }
}
