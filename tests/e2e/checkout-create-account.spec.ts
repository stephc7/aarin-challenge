import { test, expect } from '../fixtures/pages';
import { SIMPLE_PRODUCT, buildTestAccount, buildTestCustomer } from '../fixtures/test-data';

// CT-034. @creates-order + @creates-account: finaliza um pedido real e cria
// uma conta real.
test(
  'cria uma conta durante o checkout e permite login posterior com os dados informados',
  { tag: ['@creates-order', '@creates-account'] },
  async ({ page, productList, checkout, account }) => {
    const customer = buildTestCustomer();
    const { email, password } = buildTestAccount();

    await page.goto('/');
    await productList.addSimpleProductToCart(SIMPLE_PRODUCT.id);

    await checkout.goto();
    await checkout.fillBillingDetails({ ...customer, email });
    await checkout.createAccount(password);
    await checkout.selectPaymentMethod('cod');
    await checkout.acceptTerms();
    await checkout.placeOrder();

    await expect(page).toHaveURL(/\/checkout\/order-received\//);
    expect(await checkout.getOrderNumber()).toMatch(/^\d+$/);
    // A sessão já fica autenticada logo após finalizar o pedido.
    expect(await account.isLoggedIn()).toBe(true);

    await account.goto();
    await account.logout();
    await account.goto();
    await account.login(email, password);

    expect(await account.isLoggedIn()).toBe(true);
  },
);
