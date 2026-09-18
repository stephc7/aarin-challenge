import { test, expect } from '../fixtures/pages';
import { SIMPLE_PRODUCT, buildTestCustomer } from '../fixtures/test-data';

test.describe('Validação de checkout', () => {
  test.beforeEach(async ({ page, productList }) => {
    await page.goto('/');
    await productList.addSimpleProductToCart(SIMPLE_PRODUCT.id);
  });

  // CT-011
  test('bloqueia a finalização com campos obrigatórios em branco', async ({ page, checkout }) => {
    await checkout.goto();

    await checkout.acceptTerms();
    await checkout.attemptPlaceOrder();

    // Contagem de erros não é fixada (depende da config de campos obrigatórios);
    // o que importa é que exista erro e que nome/e-mail estejam entre eles.
    const errors = await checkout.getCheckoutValidationErrors();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('Nome'))).toBe(true);
    expect(errors.some((e) => e.toLowerCase().includes('e-mail'))).toBe(true);
    await expect(page).toHaveURL(/\/checkout\/$/);
  });

  // CT-033
  test('bloqueia a finalização com formato de e-mail inválido', async ({ page, checkout }) => {
    await checkout.goto();

    const customer = buildTestCustomer();
    await checkout.fillBillingDetails({ ...customer, email: 'teste@' });
    await checkout.selectPaymentMethod('cod');
    await checkout.acceptTerms();
    await checkout.attemptPlaceOrder();

    const errors = await checkout.getCheckoutValidationErrors();
    expect(
      errors.some((e) => e.toLowerCase().includes('e-mail') && e.toLowerCase().includes('inválido')),
    ).toBe(true);
    await expect(page).toHaveURL(/\/checkout\/$/);
  });
});

// CT-009
test('bloqueia o acesso direto ao checkout com o carrinho vazio', async ({ page }) => {
  await page.goto('/checkout/');

  await expect(page).toHaveURL(/\/carrinho\/$/);
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible();
});
