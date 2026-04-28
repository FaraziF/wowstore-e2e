import type { Page } from '@playwright/test';

export type ProductGridBlockSettings = {
  numberOfProducts: number;
  numberOfColumns: number;
};

export class ProductGridBlockPanel {
  constructor(public readonly page: Page) {}

  async expandSettingsPanel(): Promise<void> {
    const settingsPanelToggle = this.page.getByRole('button', { name: /^Settings$/i }).first();
    if (await settingsPanelToggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const expanded = await settingsPanelToggle.getAttribute('aria-expanded').catch(() => null);
      if (expanded === 'false') await settingsPanelToggle.click();
    }
  }

  async setNumberOfProducts(value: number): Promise<void> {
    // Use the specific XPath provided by user: (//input[@max='200'])[2]
    const productInput = this.page.locator("(//input[@max='200'])[2]");
    
    await productInput.waitFor({ state: 'visible', timeout: 10_000 });
    await productInput.clear();
    await productInput.fill(String(value));
    await productInput.dispatchEvent('change');
  }

  async setNumberOfColumns(value: number): Promise<void> {
    // Use the specific XPath provided by user: (//input[@max='12'])[2]
    const columnInput = this.page.locator("(//input[@max='12'])[2]");
    
    await columnInput.waitFor({ state: 'visible', timeout: 10_000 });
    await columnInput.clear();
    await columnInput.fill(String(value));
    await columnInput.dispatchEvent('change');
  }

  async configure(settings: ProductGridBlockSettings): Promise<void> {
    await this.expandSettingsPanel();
    
    if (settings.numberOfProducts !== undefined) {
      await this.setNumberOfProducts(settings.numberOfProducts);
    }
    
    if (settings.numberOfColumns !== undefined) {
      await this.setNumberOfColumns(settings.numberOfColumns);
    }
  }
}
