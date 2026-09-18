import { Page, expect } from '@playwright/test';

type VariationAttributes = Record<string, string>;

interface WooVariation {
  attributes: VariationAttributes;
  is_in_stock: boolean;
}

/**
 * PDP (Product Detail Page). `data-product_variations` lista todas as
 * combinações, incluindo fora de estoque (ex.: Size=M + Color=Red pode não
 * ter estoque mesmo sendo selecionável na UI)
 */
export class ProductPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async selectFirstAvailableVariation(): Promise<VariationAttributes> {
    const variationsForm = this.page.locator('form.variations_form');
    await expect(variationsForm).toBeVisible();
    // O plugin de swatches liga seus listeners após o load. Sem esperar a
    // rede, o primeiro clique pode ser ignorado. Não há outro sinal de UI.
    // eslint-disable-next-line playwright/no-networkidle -- exceção deliberada, ver comentário acima
    await this.page.waitForLoadState('networkidle');

    const raw = await variationsForm.getAttribute('data-product_variations');
    if (!raw) {
      throw new Error('Produto não possui variações (não é um produto variável).');
    }

    const variations: WooVariation[] = JSON.parse(raw);
    const available = variations.find((v) => v.is_in_stock);
    if (!available) {
      throw new Error('Nenhuma combinação de variação disponível em estoque.');
    }

    for (const [attributeName, value] of Object.entries(available.attributes)) {
      await this.selectVariationOption(attributeName, value);
    }

    await expect(this.page.locator('button.single_add_to_cart_button')).not.toHaveClass(
      /disabled/,
    );

    return available.attributes;
  }

  /** Aguarda a classe "selected", cada seleção dispara uma checagem AJAX assíncrona. */
  async selectVariationOption(attributeName: string, value: string) {
    const option = this.page.locator(
      `ul[data-attribute_name="${attributeName}"] li[data-value="${value}"]`,
    );
    await option.click();
    await expect(option).toHaveClass(/selected/);
  }

  getMainImage() {
    return this.page.locator('.woocommerce-product-gallery__image img, .images img').first();
  }

  async openTab(tabId: 'description' | 'additional_information' | 'reviews') {
    await this.page.locator(`.woocommerce-tabs ul.tabs li a[href="#tab-${tabId}"]`).click();
  }

  getTabPanel(tabId: 'description' | 'additional_information' | 'reviews') {
    return this.page.locator(`#tab-${tabId}`);
  }

  getRelatedProductLink() {
    return this.page.locator('.related.products a.product-image, section.related a.product-image').first();
  }

  async submitEmptyReview() {
    await this.openTab('reviews');
    await this.page.locator('#submit').click();
  }

  getReviewCount() {
    return this.page.locator('#comments .comment, .woocommerce-Reviews li.review');
  }

  async setQuantity(quantity: number) {
    await this.page.locator('.quantity input.qty').fill(String(quantity));
  }

  getAddToCartButton() {
    return this.page.locator('button.single_add_to_cart_button');
  }

  async addToCart() {
    await this.getAddToCartButton().click();
  }

  /**
   * Sem variação selecionada, o botão tem `pointer-events` bloqueado pela classe
   * `disabled` (não pelo atributo HTML `disabled`) — clique comum do Playwright
   * ficaria esperando o elemento se tornar "clicável" até estourar o timeout.
   * Clique nativo via `evaluate` contorna isso para provar que nada é adicionado.
   */
  async attemptAddToCartWithoutSelection() {
    await this.getAddToCartButton().evaluate((el: HTMLElement) => el.click());
  }

  async getConfirmationMessage(): Promise<string> {
    const message = this.page.locator('.woocommerce-message');
    await expect(message).toBeVisible();
    return message.innerText();
  }
}
