import { Locator, Page, expect, errors } from '@playwright/test';

export class CartPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/carrinho/');
  }

  private row(productName: string): Locator {
    return this.page.locator('tr.cart_item', {
      has: this.page.getByRole('link', { name: productName, exact: false }),
    });
  }

  async isEmpty(): Promise<boolean> {
    return this.page.getByText('Seu carrinho está vazio').isVisible();
  }

  getItemQuantityInput(productName: string): Locator {
    return this.row(productName).locator('input.qty');
  }

  /** Itens "vendidos individualmente" mostram a quantidade como texto, sem stepper. */
  getItemQuantityCell(productName: string): Locator {
    return this.row(productName).locator('.product-quantity');
  }

  getItemSubtotal(productName: string): Locator {
    return this.row(productName).locator('.product-subtotal .amount');
  }

  /**
   * "Update Cart" substitui a linha inteira via AJAX, então o `.click()` pode
   * ficar preso checando um botão já substituído no DOM — só o timeout desse
   * clique é tolerado; qualquer outro erro (ex.: seletor errado) propaga.
   */
  async submitQuantityChange(productName: string, quantity: number) {
    const qtyInput = this.getItemQuantityInput(productName);
    await qtyInput.fill(String(quantity));
    await qtyInput.dispatchEvent('change');

    const updateButton = this.page.locator('input[type="submit"][name="update_cart"]');
    await updateButton.click({ timeout: 5_000 }).catch((error) => {
      if (!(error instanceof errors.TimeoutError)) throw error;
    });
  }

  /** Confirmação real de sucesso é o subtotal final, verificado via `expect` com polling. */
  async updateQuantity(productName: string, quantity: number, expectedSubtotal: string | RegExp) {
    await this.submitQuantityChange(productName, quantity);
    await expect(this.getItemSubtotal(productName)).toHaveText(expectedSubtotal);
  }

  getCartTotal(): Locator {
    return this.page.locator('tr.order-total .amount').last();
  }

  async proceedToCheckout() {
    await this.page.locator('a.checkout-button').click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async removeItem(productName: string) {
    const removeLink = this.row(productName).locator('a.remove');
    await removeLink.evaluate((el: HTMLElement) => el.click());
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getRemovalNotice(): Promise<string> {
    const notice = this.page.locator('.woocommerce-message');
    await expect(notice).toBeVisible();
    return notice.innerText();
  }

  async applyCoupon(code: string) {
    await this.page.locator('#coupon_code').fill(code);
    await this.page.locator('input[name="apply_coupon"]').click();
  }

  async getCouponError(): Promise<string> {
    const error = this.page.locator('.woocommerce-error');
    await expect(error).toBeVisible();
    return error.innerText();
  }

  async getCouponSuccessMessage(): Promise<string> {
    const message = this.page.locator('.woocommerce-message');
    await expect(message).toBeVisible();
    return message.innerText();
  }
}
