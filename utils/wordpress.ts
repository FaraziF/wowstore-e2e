// utils/wordpress.ts
// Reusable helper functions for common WordPress admin interactions.

import type { Page, APIRequestContext } from '@playwright/test';

/**
 * Navigate to a WordPress admin page and wait for it to be fully loaded.
 * @param page  Playwright page
 * @param path  e.g. 'plugins.php' or 'admin.php?page=wowstore'
 */
export async function goToAdminPage(page: Page, path: string): Promise<void> {
  await page.goto(`/wp-admin/${path}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Dismiss any WordPress admin notices that may block interactions.
 * @param page  Playwright page
 */
export async function dismissAdminNotices(page: Page): Promise<void> {
  const dismissButtons = page.locator('.notice-dismiss');
  const count = await dismissButtons.count();
  for (let i = 0; i < count; i++) {
    await dismissButtons.nth(i).click({ force: true }).catch(() => {});
  }
}

/**
 * Wait for the Gutenberg (block) editor to be ready.
 * @param page  Playwright page
 */
export async function waitForBlockEditor(page: Page): Promise<void> {
  await page.waitForSelector('.block-editor-writing-flow', { timeout: 30_000 });
  // Wait for any block-editor loading spinners to disappear
  await page.waitForSelector('.components-spinner', { state: 'detached', timeout: 30_000 }).catch(() => {});
}

/**
 * Open the Gutenberg block inserter and search for a block by name.
 * Returns the button locator for the first matching result.
 * @param page  Playwright page
 * @param blockName  e.g. 'WowStore Product Grid'
 */
export async function searchAndGetBlock(page: Page, blockName: string) {
  // Open block inserter
  const inserterToggle = page.locator('button.edit-post-header-toolbar__inserter-toggle, button[aria-label="Toggle block inserter"]').first();
  if (!(await inserterToggle.getAttribute('aria-expanded') === 'true')) {
    await inserterToggle.click();
  }
  // Search
  const searchInput = page.locator('input.block-editor-inserter__search-input, input[placeholder*="Search"]').first();
  await searchInput.fill(blockName);
  await page.waitForTimeout(500); // debounce

  return page.locator(`.block-editor-block-types-list__item-title:text("${blockName}")`).first();
}

/**
 * Publish or update a post/page in the block editor.
 * @param page  Playwright page
 */
export async function publishPost(page: Page): Promise<void> {
  const publishBtn = page.locator('button.editor-post-publish-button, button:has-text("Publish"), button:has-text("Update")').first();
  await publishBtn.click();

  // Handle pre-publish checklist panel if it appears
  const publishPanelBtn = page.locator('button.editor-post-publish-button__button:has-text("Publish")');
  if (await publishPanelBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await publishPanelBtn.click();
  }

  await page.waitForSelector('.editor-post-publish-button[aria-disabled="false"]', { state: 'detached', timeout: 15_000 }).catch(() => {});
}

/**
 * Create a new page with a given title via the WP REST API (fast, no UI).
 * Returns the created post object { id, link }.
 * @param request  Playwright API request context
 * @param title  Page title
 * @param content  HTML or Gutenberg block markup
 */
export async function createPageViaApi(
  request: APIRequestContext,
  title: string,
  content = ''
): Promise<{ id: number; link: string }> {
  const response = await request.post('/wp-json/wp/v2/pages', {
    data: { title, content, status: 'publish' },
  });
  return response.json() as Promise<{ id: number; link: string }>;
}

/**
 * Delete a post/page by ID via the WP REST API.
 * @param request  Playwright API request context
 * @param postId  Post/page ID to delete
 */
export async function deletePostViaApi(
  request: APIRequestContext,
  postId: number
): Promise<void> {
  await request.delete(`/wp-json/wp/v2/posts/${postId}`, {
    params: { force: true },
  });
}

/**
 * Get the WP REST API nonce from the current authenticated page.
 * @param page  Playwright page
 */
export async function getWpNonce(page: Page): Promise<string> {
  return page.evaluate(() => {
    const w = window as Window & {
      wpApiSettings?: { nonce?: string };
      wp?: { apiFetch?: { nonceMiddleware?: { nonce?: string } } };
    };
    return w.wpApiSettings?.nonce ?? w.wp?.apiFetch?.nonceMiddleware?.nonce ?? '';
  });
}
