import { Page, expect } from '@playwright/test';
import { CustomerBillingData } from '../fixtures/test-data';

export type PaymentMethod = 'cod' | 'bacs' | 'cheque';

export class CheckoutPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/checkout/');
  }

  async fillBillingDetails(data: CustomerBillingData) {
    await this.page.locator('#billing_first_name').fill(data.firstName);
    await this.page.locator('#billing_last_name').fill(data.lastName);
    await this.page.locator('#billing_country').selectOption('BR');
    await this.page.locator('#billing_address_1').fill(data.addressLine1);
    await this.page.locator('#billing_city').fill(data.city);
    // O campo de estado só é populado com as opções do Brasil depois que o
    // país é selecionado
    await this.page
      .locator(`#billing_state option[value="${data.state}"]`)
      .waitFor({ state: 'attached' });
    await this.page.locator('#billing_state').selectOption(data.state);
    await this.page.locator('#billing_postcode').fill(data.postcode);
    await this.page.locator('#billing_phone').fill(data.phone);
    await this.page.locator('#billing_email').fill(data.email);
  }

  /** Diferente do cadastro em /minha-conta/, este campo não tem proteção anti-bot `fill()` funciona. */
  async createAccount(password: string) {
    await this.page.locator('#createaccount').check();
    await this.page.locator('#account_password').fill(password);
  }

  async selectPaymentMethod(method: PaymentMethod) {
    await this.page.locator(`#payment_method_${method}`).check();
  }

  async acceptTerms() {
    await this.page.locator('#terms').check();
  }

  async placeOrder() {
    await this.page.locator('#place_order').click();
    await this.page.waitForURL(/\/checkout\/order-received\//, { timeout: 20_000 });
  }

  /**
   * Dois `.click()` do Playwright seriam serializados pela checagem de
   * actionability e não reproduziriam um clique duplo real — por isso os
   * dois cliques nativos saem juntos no mesmo `evaluate()` (CT-036).
   */
  async placeOrderWithDoubleClick() {
    await this.page
      .locator('#place_order')
      .evaluate((el: HTMLElement) => {
        el.click();
        el.click();
      });
    await this.page.waitForURL(/\/checkout\/order-received\//, { timeout: 20_000 });
  }

  /** Sem esperar redirecionamento, usado nos cenários negativos, que ficam em `/checkout/`. */
  async attemptPlaceOrder() {
    await this.page.locator('#place_order').click();
  }

  async getOrderNumber(): Promise<string> {
    const orderNumber = this.page.locator(
      'li.woocommerce-order-overview__order strong, .woocommerce-order-overview__order strong',
    );
    await expect(orderNumber).toBeVisible();
    return (await orderNumber.innerText()).trim();
  }

  async getPaymentMethodLabel(): Promise<string> {
    const label = this.page.locator('.woocommerce-order-overview__payment-method strong');
    await expect(label).toBeVisible();
    return (await label.innerText()).trim();
  }

  async getThankYouMessage(): Promise<string> {
    const message = this.page.locator('.woocommerce-thankyou-order-received');
    await expect(message).toBeVisible();
    return message.innerText();
  }

  async getCheckoutValidationErrors(): Promise<string[]> {
    const errors = this.page.locator('.woocommerce-error li, .woocommerce-NoticeGroup-checkout li');
    await expect(errors.first()).toBeVisible();
    return errors.allInnerTexts();
  }
}
