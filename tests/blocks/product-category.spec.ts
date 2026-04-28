import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import { createCategory, deleteCategory } from '../../utils/woocommerce';
import { openFrontendPage } from '../wp/helpers';
import { ProductCategoryBlockPanel } from '../pom/blocks/ProductCategoryBlockPanel';
import { PostEditorPage } from '../pom/wp/PostEditorPage';
import { productCategoryScenarios } from '../scenarios/productCategory.scenarios';

async function expectProductCategoryTilesCount(
  frontend: ReturnType<typeof openFrontendPage> extends Promise<infer P> ? P : never,
  headingText: string,
  expectedCount: number,
): Promise<void> {
  const heading = frontend.getByRole('heading', { name: headingText }).first();
  await expect(heading).toBeVisible({ timeout: 20_000 });

  const blockRoot = heading.locator(
    "xpath=ancestor::*[self::section or self::div][.//li[contains(@class,'product-category')] or .//*[contains(@class,'woocommerce-loop-category__title')] or .//*[contains(@class,'px-category')] or .//*[contains(@class,'product-category')]][1]",
  );

  const wcCategoryLis = blockRoot.locator('li.product-category');
  if (await wcCategoryLis.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
    await expect(wcCategoryLis).toHaveCount(expectedCount, { timeout: 20_000 });
    return;
  }

  const wcTitles = blockRoot.locator('.woocommerce-loop-category__title');
  if (await wcTitles.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
    await expect(wcTitles).toHaveCount(expectedCount, { timeout: 20_000 });
    return;
  }

  const productLabels = blockRoot.getByText(/\b\d+\s+Products?\b/i);
  await expect(productLabels).toHaveCount(expectedCount, { timeout: 20_000 });
}

test.describe('WowStore – Product Category Blocks (BDD)', () => {
  const categoryIds: number[] = [];

  test.beforeAll(async ({ request }) => {
    for (let i = 1; i <= 6; i++) {
      const cat = await createCategory(request, `E2E PCAT ${Date.now()} ${i}`);
      categoryIds.push(cat.id);
    }
  });

  test.afterAll(async ({ request }) => {
    for (const id of categoryIds) {
      await deleteCategory(request, id).catch(() => {});
    }
  });

  for (const s of productCategoryScenarios) {
    test(s.title, async ({ page, editor }) => {
      test.setTimeout(120_000);

      const postEditor = new PostEditorPage(page, editor);
      const panel = new ProductCategoryBlockPanel(page);

      await test.step('Gherkin', async () => {
        // Keeping the scenario text close to the test, without bloating the test body.
        test.info().annotations.push({ type: 'gherkin', description: s.gherkin });
      });

      await test.step('Given I navigate to the new post page', async () => {
        await postEditor.gotoNewPost();
      });

      await test.step('When I add a post title', async () => {
        await postEditor.fillPostTitle(`E2E – ${s.blockSearchText} – ${Date.now()}`);
      });

      await test.step(`And I insert the "${s.blockSearchText}" block`, async () => {
        await postEditor.insertBlockViaInserter(s.blockSearchText, new RegExp(s.blockSearchText, 'i'));
      });

      await test.step('Then I should see the block inserted successfully', async () => {
        await postEditor.expectBlockInserted(s.blockBreadcrumbLabel);
      });

      await test.step('When I configure the block settings in the right sidebar', async () => {
        await postEditor.openBlockSidebar();
        await panel.configure({
          numberOfCategories: s.numberOfCategories,
          enableHeading: s.enableHeading,
          headingText: s.headingText,
        });
      });

      await test.step('And I publish the post', async () => {
        await postEditor.publish();
      });

      await test.step('And I view the post on the frontend', async () => {
        const frontend = await openFrontendPage(editor);
        await frontend.waitForLoadState('domcontentloaded');
        await expectProductCategoryTilesCount(frontend, s.headingText, s.numberOfCategories);
      });
    });
  }
});
