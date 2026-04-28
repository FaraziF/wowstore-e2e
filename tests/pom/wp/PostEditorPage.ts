import type { Editor } from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';

import { openBlockSettingsSidebar } from '../../wp/helpers';

export class PostEditorPage {
  constructor(
    public readonly page: Page,
    public readonly editor: Editor,
  ) {}

  async gotoNewPost(): Promise<void> {
    // baseURL resolved from WP_BASE_URL in .env via playwright.config.ts
    await this.page.goto('/wp-admin/post-new.php');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillPostTitle(title: string): Promise<void> {
    const titleInput = this.page
      .getByRole('textbox', { name: /add title/i })
      .or(this.page.locator('textarea#post-title-0'))
      .first();
    await titleInput.waitFor({ state: 'visible', timeout: 20_000 });
    await titleInput.fill(title);
  }

  async insertBlockViaInserter(searchText: string, resultText?: RegExp): Promise<void> {
    const inserterButton = this.page
      .getByRole('button', { name: /block inserter|add block/i })
      .first();
    await inserterButton.click();

    const searchInput = this.page
      .locator('input.block-editor-inserter__search-input, input[placeholder*="Search"]')
      .first();
    await searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    await searchInput.fill(searchText);
    await this.page.waitForTimeout(600);

    const result = this.page
      .locator(
        '[class*="block-types-list"] button, [class*="block-types-list"] li, ' +
          '.block-editor-block-types-list__item',
      )
      .filter({ hasText: resultText ?? new RegExp(searchText, 'i') })
      .first();
    await result.click();

    await this.page.keyboard.press('Escape').catch(() => {});
  }

  async expectBlockInserted(blockLabel: RegExp): Promise<void> {
    const breadcrumb = this.page
      .locator(
        '.block-editor-block-breadcrumb, .block-editor-block-breadcrumbs, [class*="block-breadcrumb"]',
      )
      .first();
    await breadcrumb.getByText(blockLabel).waitFor({ state: 'visible', timeout: 15_000 });
  }

  async openBlockSidebar(): Promise<void> {
    await openBlockSettingsSidebar(this.page);
  }

  async publish(): Promise<void> {
    await this.editor.publishPost();
  }
}

