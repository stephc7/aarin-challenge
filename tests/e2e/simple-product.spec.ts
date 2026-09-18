import { test, expect } from '../fixtures/pages';
import { SIMPLE_PRODUCT } from '../fixtures/test-data';

// CT-002: caminho alternativo ao fluxo obrigatório, que usa um produto variável.
test('CT-002: adiciona produto simples ao carrinho direto pela listagem', async ({
  page,
  productList,
  cart,
}) => {
  await page.goto('/');
  await productList.addSimpleProductToCart(SIMPLE_PRODUCT.id);

  await cart.goto();
  // "Vendido individualmente" no WooCommerce: quantidade fixa, sem input editável.
  await expect(
    cart.getItemQuantityCell(SIMPLE_PRODUCT.name),
    `Pré-condição do catálogo: "${SIMPLE_PRODUCT.name}" precisa continuar "vendido individualmente" — ver README > Limitações conhecidas`,
  ).toHaveText(/1/);
  await expect(cart.getItemSubtotal(SIMPLE_PRODUCT.name)).toBeVisible();
});
