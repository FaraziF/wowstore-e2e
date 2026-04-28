import type { Editor, Admin } from '@wordpress/e2e-test-utils-playwright';
import type { Page } from '@playwright/test';

/**
 * Open the WP editor's right sidebar ("Settings") and keep it on Block settings.
 *
 * WP's upstream helper (`editor.openDocumentSettingsSidebar`) can fail in strict
 * mode if plugins add additional "Settings" buttons in the top bar.
 */
export async function openBlockSettingsSidebar(page: Page): Promise<void> {
  // Prefer the canonical WP button that controls the settings sidebar.
  // In Gutenberg this is the "Settings" toggle with aria-controls="edit-post:block".
  // Some installs don't expose an accessible "Editor top bar" region, so we
  // intentionally fall back to a global selector.
  const topBar = page.getByRole('region', { name: /editor top bar/i }).first();
  const topBarToggle = topBar.locator('button[aria-controls="edit-post:block"]');
  const globalToggle = page.locator('button[aria-controls="edit-post:block"]');

  const wpSettingsToggle = topBarToggle
    .or(globalToggle)
    .or(topBar.getByRole('button', { name: /^Settings$/i, exact: true }))
    .or(page.getByRole('button', { name: /^Settings$/i, exact: true }))
    .first();

  // If sidebar is already open (pressed), no-op.
  const pressed = await wpSettingsToggle.getAttribute('aria-pressed').catch(() => null);
  if (pressed !== 'true') {
    await wpSettingsToggle.click();
  }

  // Ensure "Block" tab is selected when present.
  await page.getByRole('tab', { name: /^block$/i }).click().catch(() => {});
}

/**
 * Create a new WP Page in the editor.
 * Keeps all navigation logic inside WordPress-maintained utilities.
 */
export async function createNewPage(admin: Admin, title: string): Promise<void> {
  await admin.createNewPost({
    postType: 'page',
    title,
    showWelcomeGuide: false,
  });
}

/**
 * Resolve a registered block name by matching its title/label, then insert it.
 * This avoids hardcoding block namespace names (which differ across plugins).
 */
export async function insertBlockByTitle(
  editor: Editor,
  blockTitle: string,
): Promise<void> {
  const blockName = await editor.page.evaluate((title) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!w?.wp?.blocks?.getBlockTypes) return null;
    const types = w.wp.blocks.getBlockTypes();
    const match = types.find((t: { title?: string }) => {
      const tTitle = (t?.title ?? '').toString();
      return tTitle.toLowerCase() === title.toLowerCase();
    });
    return match?.name ?? null;
  }, blockTitle);

  if (!blockName) {
    // Fallback: contains match (some blocks include suffixes like "#1")
    const fuzzy = await editor.page.evaluate((title) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (!w?.wp?.blocks?.getBlockTypes) return null;
      const types = w.wp.blocks.getBlockTypes();
      const lower = title.toLowerCase();
      const match = types.find((t: { title?: string }) =>
        (t?.title ?? '').toString().toLowerCase().includes(lower),
      );
      return match?.name ?? null;
    }, blockTitle);

    if (!fuzzy) {
      throw new Error(`Could not find block type by title "${blockTitle}".`);
    }
    await editor.insertBlock({ name: fuzzy });
    return;
  }

  await editor.insertBlock({ name: blockName });
}

/**
 * Open the published page on the frontend.
 *
 * WordPress sometimes keeps the "publish panel" open which can intercept clicks
 * on the top-bar "View" dropdown used by `editor.openPreviewPage()`.
 * This helper prefers the "View Page/View Post" button/link in the publish panel.
 */
export async function openFrontendPage(editor: Editor): Promise<Page> {
  const ctx = editor.page.context();

  const viewButton = editor.page
    .getByRole('button', { name: /view page|view post/i })
    .first();
  const viewLink = editor.page
    .getByRole('link', { name: /view page|view post/i })
    .first();

  // 1) Prefer "View Page" button (often opens a new tab).
  if (await viewButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
    const newPagePromise = ctx.waitForEvent('page', { timeout: 8_000 }).catch(() => null);
    await viewButton.click();
    const newPage = await newPagePromise;
    if (newPage) return newPage;
    // If it navigated in the same tab, just return current page.
    return editor.page;
  }

  // 2) Next: "View Page" link.
  if (await viewLink.isVisible({ timeout: 1_000 }).catch(() => false)) {
    const href = await viewLink.getAttribute('href').catch(() => null);
    if (href) {
      const newPage = await ctx.newPage();
      await newPage.goto(href, { waitUntil: 'domcontentloaded' });
      return newPage;
    }
  }

  // 3) Fallback: close overlays and use WP's preview dropdown.
  await editor.page.keyboard.press('Escape').catch(() => {});
  await editor.page.keyboard.press('Escape').catch(() => {});
  return editor.openPreviewPage();
}

