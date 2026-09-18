import { test, expect } from '../fixtures/pages';
import { PaymentMethod } from '../pages/CheckoutPage';
import { SIMPLE_PRODUCT, buildTestCustomer } from '../fixtures/test-data';

// "Pagamento na entrega" (cod) já é validado em purchase-flow.spec.ts, aqui temos outros dois métodos.
const paymentMethods: { method: PaymentMethod; expectedLabel: string }[] = [
  { method: 'bacs', expectedLabel: 'Transferência bancária' },
  { method: 'cheque', expectedLabel: 'Cheque' },
];

test.describe('Métodos de pagamento alternativos', () => {
  for (const { method, expectedLabel } of paymentMethods) {
    // @creates-order: finaliza um pedido real 
    test(
      `finaliza o pedido com "${expectedLabel}"`,
      { tag: '@creates-order' },
      async ({ page, productList, checkout }) => {
        const customer = buildTestCustomer();

        await page.goto('/');
        await productList.addSimpleProductToCart(SIMPLE_PRODUCT.id);

        await checkout.goto();
        await checkout.fillBillingDetails(customer);
        await checkout.selectPaymentMethod(method);
        await checkout.acceptTerms();
        await checkout.placeOrder();

        await expect(page).toHaveURL(/\/checkout\/order-received\//);
        expect(await checkout.getPaymentMethodLabel()).toBe(expectedLabel);
        expect(await checkout.getOrderNumber()).toMatch(/^\d+$/);
      },
    );
  }
});
