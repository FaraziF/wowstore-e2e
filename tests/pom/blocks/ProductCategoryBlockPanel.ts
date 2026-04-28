import type { Page } from '@playwright/test';

export type ProductCategoryBlockSettings = {
  numberOfCategories: number;
  enableHeading: boolean;
  headingText: string;
};

export class ProductCategoryBlockPanel {
  constructor(public readonly page: Page) {}

  async expandSettingsPanel(): Promise<void> {
    const settingsPanelToggle = this.page.getByRole('button', { name: /^Settings$/i }).first();
    if (await settingsPanelToggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const expanded = await settingsPanelToggle.getAttribute('aria-expanded').catch(() => null);
      if (expanded === 'false') await settingsPanelToggle.click();
    }
  }

  async setNumberOfCategories(value: number): Promise<void> {
    const numberInput = this.page
      .getByLabel(/^Number of Categories$/i)
      .or(this.page.getByLabel(/number of categor|categories count|number of categories/i))
      .or(this.page.getByRole('spinbutton', { name: /number of categor|categories/i }))
      // User-provided fallback: (//input[@max='200'])[2]
      .or(this.page.locator("(//input[@max='200'])[2]"))
      .first();
    await numberInput.waitFor({ state: 'visible', timeout: 10_000 });
    await numberInput.fill(String(value));
  }

  async setEnableHeading(enabled: boolean): Promise<void> {
    const toggle = this.page
      .getByLabel(/^Enable Heading$/i)
      .or(this.page.getByLabel(/enable heading|show heading/i))
      .or(this.page.getByRole('checkbox', { name: /enable heading|show heading/i }))
      // User-provided fallback: (//input[@class='components-form-toggle__input'])[1]
      .or(this.page.locator("(//input[@class='components-form-toggle__input'])[1]"))
      .first();

    await toggle.waitFor({ state: 'visible', timeout: 10_000 });
    const isChecked = await toggle.isChecked().catch(() => false);
    if (enabled !== isChecked) await toggle.click();
  }

  async expandHeadingPanel(): Promise<void> {
    const headingPanelToggle = this.page
      .getByRole('button', { name: /^Heading$/i })
      // User-provided fallback: //span[normalize-space(text())='Heading']
      .or(this.page.locator("//span[normalize-space(text())='Heading']").locator('..'))
      .or(this.page.locator("//span[normalize-space(text())='Heading']"))
      .first();

    if (await headingPanelToggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const expanded = await headingPanelToggle.getAttribute('aria-expanded').catch(() => null);
      if (expanded && expanded !== 'true') await headingPanelToggle.click();
      if (expanded === null) await headingPanelToggle.click();
    }
  }

  async setHeadingText(text: string): Promise<void> {
    const input = this.page
      .getByLabel(/add heading/i)
      .or(this.page.getByRole('textbox', { name: /add heading/i }))
      // User-provided fallback: //input[@value='Product Category #1']
      .or(this.page.locator("//input[@value='Product Category #1']"))
      .first();

    await input.waitFor({ state: 'visible', timeout: 10_000 });
    await input.fill(text);
  }

  async configure(settings: ProductCategoryBlockSettings): Promise<void> {
    await this.expandSettingsPanel();
    await this.setNumberOfCategories(settings.numberOfCategories);
    await this.setEnableHeading(settings.enableHeading);
    if (settings.enableHeading) {
      await this.expandHeadingPanel();
      await this.setHeadingText(settings.headingText);
    }
  }
}

