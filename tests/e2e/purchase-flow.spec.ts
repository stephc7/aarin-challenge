import { test, expect } from '../fixtures/pages';
import { buildTestCustomer } from '../fixtures/test-data';
import { parsePrice, formatPrice } from '../utils/price';

// Fluxo obrigatório (CT-001, CT-003, CT-005, CT-006, CT-007, CT-010, CT-012):
// home -> vitrine -> PDP de produto variável -> carrinho -> checkout -> confirmação.
test.describe('Fluxo de compra obrigatório', () => {
  const PRODUCT_NAME = 'Ingrid Running Jacket';
  const PRODUCT_SLUG = 'ingrid-running-jacket';

  // @creates-order: finaliza um pedido real (COD).
  test(
    'completa o fluxo de home até a confirmação do pedido',
    { tag: '@creates-order' },
    async ({ page, productList, productPage, cart, checkout }) => {
      const customer = buildTestCustomer();

      await test.step('1. Acessar a página inicial', async () => {
        await page.goto('/');
        await expect(page).toHaveTitle(/EBAC/);
      });

      await test.step('2. Escolher um produto variável da vitrine', async () => {
        await productList.openVariableProduct(PRODUCT_SLUG);
        await expect(page.locator('h1.product_title')).toHaveText(PRODUCT_NAME);
      });

      await test.step('3. Selecionar variação disponível e adicionar ao carrinho', async () => {
        const variation = await productPage.selectFirstAvailableVariation();
        await productPage.setQuantity(1);
        await productPage.addToCart();

        const confirmation = await productPage.getConfirmationMessage();
        expect(confirmation).toContain(PRODUCT_NAME);
        expect(confirmation.toLowerCase()).toContain('adicionado');
        test.info().annotations.push({
          type: 'variation-selecionada',
          description: JSON.stringify(variation),
        });
      });

      await test.step('4. Acessar a tela de carrinho', async () => {
        await cart.goto();
        await expect(cart.getItemQuantityInput(PRODUCT_NAME)).toHaveValue('1');
      });

      await test.step('5. Alterar a quantidade do item no carrinho', async () => {
        const unitPriceText = await cart.getItemSubtotal(PRODUCT_NAME).innerText();
        const unitPrice = parsePrice(unitPriceText);
        const expectedSubtotal = formatPrice(unitPrice * 3);

        await cart.updateQuantity(PRODUCT_NAME, 3, expectedSubtotal);
        await expect(cart.getCartTotal()).toHaveText(expectedSubtotal);
      });

      await test.step('6. Seguir para a etapa de checkout', async () => {
        await cart.proceedToCheckout();
        await expect(page).toHaveURL(/\/checkout\//);
        await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
      });

      await test.step('7. Finalizar o pedido até onde for tecnicamente possível', async () => {
        await checkout.fillBillingDetails(customer);
        // COD, bacs e cheque completam o pedido igualmente aqui (nenhum depende de
        // gateway externo); COD é usado no fluxo obrigatório por ser o primeiro da lista.
        await checkout.selectPaymentMethod('cod');
        await checkout.acceptTerms();
        await checkout.placeOrder();

        await expect(page).toHaveURL(/\/checkout\/order-received\//);
        const thankYouMessage = await checkout.getThankYouMessage();
        expect(thankYouMessage).toContain('Obrigado');

        const orderNumber = await checkout.getOrderNumber();
        expect(orderNumber).toMatch(/^\d+$/);
        test.info().annotations.push({ type: 'numero-do-pedido', description: orderNumber });
      });
    },
  );
});
