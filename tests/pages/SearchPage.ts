import { Locator, Page } from '@playwright/test';

/**
 * Busca de produtos. O ícone abre um modal fechado por padrão, e o tema
 * duplica o formulário no DOM (mobile/desktop)
 */
export class SearchPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async search(term: string) {
    await this.page.locator('.zmdi.zmdi-search:visible').first().click();
    const input = this.page.locator('.modal.in input[name="s"]:visible').first();
    await input.fill(term);
    await input.press('Enter');
    await this.page.waitForLoadState('domcontentloaded');
  }

  getResults(): Locator {
    return this.page.locator('.products .product');
  }

  getNoResultsMessage(): Locator {
    return this.page.locator('.woocommerce-info, .woocommerce-message');
  }
}
