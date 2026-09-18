import { Locator, Page } from '@playwright/test';

export type SortOption = 'menu_order' | 'popularity' | 'rating' | 'date' | 'price' | 'price-desc';

/**
 * Vitrine de produtos (home e /produtos/). O tema duplica cards/controles no
 * DOM para outros breakpoints, e vários botões (Comprar, Ver opções, Quick
 * View, wishlist, comparar) só aparecem via CSS `:hover`, com bounding box
 * 0×0 até lá. Por isso: cliques usam `.evaluate(el => el.click())` (ignora
 * visibilidade), leituras usam `:visible` pra pegar a cópia certa.
 */
export class ProductListPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async openVariableProduct(productSlug: string) {
    const link = this.page
      .locator(`a.product_type_variable[href*="/product/${productSlug}/"]`)
      .first();
    await link.evaluate((el: HTMLElement) => el.click());
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Identificado pelo ID, não pelo nome 
   * Fecha o modal ao final, como ele é reaproveitado a cada
   * chamada, adicionar dois produtos em sequência sem fechar faria a
   * segunda chamada não esperar a própria adição terminar.
   */
  async addSimpleProductToCart(productId: string) {
    await this.assertProductExists(productId);
    const link = this.page.locator(`a.ajax_add_to_cart[href="?add-to-cart=${productId}"]`).first();
    await link.evaluate((el: HTMLElement) => el.click());
    const modal = this.page.locator('.popup-cart');
    await modal.waitFor({ state: 'visible' });
    await this.page.locator('.modal.in .close').first().click();
    await modal.waitFor({ state: 'hidden' });
  }

  async goto() {
    await this.page.goto('/produtos/');
  }

  /** Espera a URL mudar `domcontentloaded` já está satisfeito antes do reload acontecer. */
  async sortBy(criteria: SortOption) {
    await Promise.all([
      this.page.waitForURL(/orderby=/),
      this.page.locator('form.woocommerce-ordering select').selectOption(criteria),
    ]);
  }

  async goToPage(pageNumber: number) {
    await Promise.all([
      this.page.waitForURL(new RegExp(`/page/${pageNumber}/`)),
      this.page
        .locator('.woocommerce-pagination a', { hasText: String(pageNumber) })
        .first()
        .click(),
    ]);
  }

  /** Pode ter menos itens que o total de cards. nem todo produto tem preço. */
  getDisplayedPrices(): Locator {
    return this.page.locator('.products .product .price');
  }

  /** Só leitura de texto, não precisa de `:visible` */
  getProductCard(productId: string): Locator {
    return this.page.locator(`.product:has(a[href="?add-to-cart=${productId}"])`).first();
  }

  /** Primeiro produto em promoção na vitrine — não depende de qual é, só que exista algum. */
  getFirstOnSaleCard(): Locator {
    return this.page.locator('.products .product', { has: this.page.locator('.onsale') }).first();
  }

  /**
   * Falha rápido e com mensagem clara se o produto saiu do catálogo compartilhado,
   * em vez de um timeout genérico no clique — ver README > Limitações conhecidas.
   */
  private async assertProductExists(productId: string) {
    const count = await this.getProductCard(productId).count();
    if (count === 0) {
      throw new Error(
        `Produto ID ${productId} não encontrado no catálogo. Este teste depende de um item específico ` +
          'do catálogo compartilhado — ver README > Limitações conhecidas.',
      );
    }
  }

  /** Contador de itens no mini-carrinho do header, atualizado via AJAX sem reload. */
  getCartCount(): Locator {
    return this.page.locator('.mini-cart-items').first();
  }

  async getProductIdsOnPage(): Promise<string[]> {
    return this.page.locator('.products .product').evaluateAll((cards) =>
      cards
        .map((card) => card.querySelector('[data-product-id]')?.getAttribute('data-product-id'))
        .filter((id): id is string => Boolean(id)),
    );
  }

  async openQuickView(productId: string) {
    const button = this.page.locator(`a.yith-wcqv-button[data-product_id="${productId}"]`).first();
    await button.evaluate((el: HTMLElement) => el.click());
    await this.getQuickViewModal().waitFor({ state: 'visible' });
  }

  getQuickViewModal(): Locator {
    return this.page.locator('#yith-quick-view-modal, .yith-wcqv-wrapper').first();
  }

  getQuickViewTitle(): Locator {
    return this.getQuickViewModal().locator('.product_title').first();
  }

  getQuickViewPrice(): Locator {
    return this.getQuickViewModal().locator('.price').first();
  }

  /**
   * Escopado por `.add-to-wishlist-{id}` porque o tema reaproveita
   * `data-product-id` em outros elementos da seção. Espera o feedback ficar
   * `attached` (não `visible`, some por CSS até hover) antes de navegar
   * pra wishlist, senão a lista aparece vazia por uma corrida com o AJAX.
   */
  async addToWishlist(productId: string) {
    const link = this.page.locator(`.add-to-wishlist-${productId} a.add_to_wishlist`).first();
    await link.evaluate((el: HTMLElement) => el.click());
    await this.page.locator('.yith-wcwl-wishlistaddedbrowse').first().waitFor({ state: 'attached' });
  }

  /** Espera a tabela carregar no colorbox antes de retornar, mesma razão do wishlist acima. */
  async addToCompare(productId: string) {
    await this.assertProductExists(productId);
    const link = this.page.locator(`a.compare[data-product_id="${productId}"]`).first();
    await link.evaluate((el: HTMLElement) => el.click());
    await this.getCompareFrame().locator('table.compare-list').first().waitFor();
  }

  /** iframe tem `name` dinâmico (timestamp), localizado pelo `src`, que é estável. */
  getCompareFrame() {
    return this.page.frameLocator('iframe[src*="yith-woocompare-view-table"]');
  }

  async closeCompareOverlay() {
    const closeButton = this.page.locator('#cboxClose');
    await closeButton.click();
    await closeButton.waitFor({ state: 'hidden' });
  }
}
