import { test, expect } from '../fixtures/pages';
import { SIMPLE_PRODUCT } from '../fixtures/test-data';
import { parsePrice } from '../utils/price';

test.describe('Gerenciamento do carrinho', () => {
  test.beforeEach(async ({ page, productList }) => {
    await page.goto('/');
    await productList.addSimpleProductToCart(SIMPLE_PRODUCT.id);
  });

  // CT-008
  test('remove um item do carrinho e mostra o carrinho vazio', async ({ cart }) => {
    await cart.goto();

    await cart.removeItem(SIMPLE_PRODUCT.name);

    const notice = await cart.getRemovalNotice();
    expect(notice).toContain(SIMPLE_PRODUCT.name);
    expect(notice.toLowerCase()).toContain('removido');
    expect(await cart.isEmpty()).toBe(true);
  });

  // CT-016
  test('aplica um cupom inválido e mantém o total inalterado', async ({ cart }) => {
    await cart.goto();

    const totalBefore = await cart.getCartTotal().innerText();

    await cart.applyCoupon('CUPOMINEXISTENTE123');

    const error = await cart.getCouponError();
    expect(error.toLowerCase()).toContain('não existe');
    await expect(cart.getCartTotal()).toHaveText(totalBefore);
  });

  test('aplica um cupom válido e reduz o total em 10%', async ({ cart }) => {
    await cart.goto();

    const totalBeforeText = await cart.getCartTotal().innerText();

    await cart.applyCoupon('EBAC10');

    const message = await cart.getCouponSuccessMessage();
    expect(message.toLowerCase()).toContain('sucesso');
    await expect(cart.getCartTotal()).not.toHaveText(totalBeforeText);

    const totalAfter = parsePrice(await cart.getCartTotal().innerText());
    const totalBefore = parsePrice(totalBeforeText);
    expect(totalAfter).toBeCloseTo(totalBefore * 0.9, 2);
  });
});
