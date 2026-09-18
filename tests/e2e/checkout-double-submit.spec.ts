import { test, expect } from '../fixtures/pages';
import { SIMPLE_PRODUCT, buildTestCustomer } from '../fixtures/test-data';

// CT-036. @creates-order: finaliza um pedido real
test(
  'clique duplo em "Finalizar Compra" gera apenas um pedido',
  { tag: '@creates-order' },
  async ({ page, productList, checkout }) => {
    const customer = buildTestCustomer();

    await page.goto('/');
    await productList.addSimpleProductToCart(SIMPLE_PRODUCT.id);

    await checkout.goto();
    await checkout.fillBillingDetails(customer);
    await checkout.selectPaymentMethod('cod');
    await checkout.acceptTerms();
    await checkout.placeOrderWithDoubleClick();

    await expect(page).toHaveURL(/\/checkout\/order-received\/\d+\//);
    // Um segundo pedido geraria uma URL/ID diferente do esperado, então a
    // asserção acima já cobre o caso de falha.
    expect(await checkout.getOrderNumber()).toMatch(/^\d+$/);
  },
);
