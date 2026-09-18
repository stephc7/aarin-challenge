import { test, expect } from '../fixtures/pages';
import { SIMPLE_PRODUCT, SIMPLE_PRODUCT_2 } from '../fixtures/test-data';
import { parsePrice } from '../utils/price';

// CT-030
test('adiciona dois produtos diferentes e valida totais individuais e geral', async ({
  page,
  productList,
  cart,
}) => {
  await page.goto('/');
  await productList.addSimpleProductToCart(SIMPLE_PRODUCT.id);
  await productList.addSimpleProductToCart(SIMPLE_PRODUCT_2.id);

  await cart.goto();
  await expect(cart.getItemSubtotal(SIMPLE_PRODUCT.name)).toBeVisible();
  await expect(cart.getItemSubtotal(SIMPLE_PRODUCT_2.name)).toBeVisible();

  const subtotalA = parsePrice(await cart.getItemSubtotal(SIMPLE_PRODUCT.name).innerText());
  const subtotalB = parsePrice(await cart.getItemSubtotal(SIMPLE_PRODUCT_2.name).innerText());
  const total = parsePrice(await cart.getCartTotal().innerText());

  expect(total).toBeCloseTo(subtotalA + subtotalB, 2);
});

// CT-031
test('itens do carrinho persistem ao navegar para outras páginas', async ({
  page,
  productList,
  cart,
}) => {
  await page.goto('/');
  await productList.addSimpleProductToCart(SIMPLE_PRODUCT.id);

  await page.goto('/');
  await page.goto('/produtos/');

  await cart.goto();
  await expect(cart.getItemSubtotal(SIMPLE_PRODUCT.name)).toBeVisible();
  expect(await cart.isEmpty()).toBe(false);
});
