import { test, expect } from '../fixtures/pages';

const PRODUCT_SLUG = 'ingrid-running-jacket';
const PRODUCT_NAME = 'Ingrid Running Jacket';

test.describe('Quantidade inválida', () => {
  // CT-025
  for (const invalidQuantity of [0, -3]) {
    test(`PDP: não adiciona ao carrinho com quantidade ${invalidQuantity}`, async ({
      page,
      productPage,
      cart,
    }) => {
      await page.goto(`/product/${PRODUCT_SLUG}/`);
      await productPage.selectFirstAvailableVariation();
      await productPage.setQuantity(invalidQuantity);
      await productPage.addToCart();

      // Sem feedback na UI (o clique é ignorado pelo JS), o que importa é o carrinho vazio.
      await cart.goto();
      expect(await cart.isEmpty()).toBe(true);
    });
  }

  // CT-032: quantidade 0 é tratada como remoção do item (comportamento
  // padrão do WooCommerce), o que é uma resposta válida ao valor inválido.
  test('Carrinho: quantidade 0 remove o item sem quebrar o carrinho', async ({
    page,
    productPage,
    cart,
  }) => {
    await page.goto(`/product/${PRODUCT_SLUG}/`);
    await productPage.selectFirstAvailableVariation();
    await productPage.addToCart();

    await cart.goto();
    await cart.submitQuantityChange(PRODUCT_NAME, 0);

    await expect.poll(() => cart.isEmpty()).toBe(true);
  });

  // CT-032: servidor rejeita e mantém o total original. Achado de qualidade (ver
  // Bugs): o input continua mostrando o valor negativo até a página recarregar.
  test('Carrinho: quantidade negativa não corrompe o total', async ({
    page,
    productPage,
    cart,
  }) => {
    await page.goto(`/product/${PRODUCT_SLUG}/`);
    await productPage.selectFirstAvailableVariation();
    await productPage.addToCart();

    await cart.goto();
    const unitPriceText = await cart.getItemSubtotal(PRODUCT_NAME).innerText();
    await cart.submitQuantityChange(PRODUCT_NAME, -3);

    await expect(cart.getCartTotal()).toHaveText(unitPriceText);
  });
});
