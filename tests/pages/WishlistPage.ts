import { Locator, Page } from '@playwright/test';

export class WishlistPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/lista-de-desejos/');
  }

  private row(productName: string): Locator {
    return this.page.locator('table.shop_table tbody tr', {
      has: this.page.locator('.product-name', { hasText: productName }),
    });
  }

  hasProduct(productName: string): Locator {
    return this.row(productName).locator('.product-name');
  }

  async isEmpty(): Promise<boolean> {
    return this.page.getByText('No products were added to the wishlist').isVisible();
  }

  /**
   * Diferente do "×" de remover do carrinho, este link já é visível sem
   * precisar de clique nativo via `evaluate()`.
   */
  async removeProduct(productName: string) {
    await this.row(productName).locator('.product-remove a, a.remove_from_wishlist').click();
  }
}
