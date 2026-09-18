import { test as base } from '@playwright/test';
import { ProductListPage } from '../pages/ProductListPage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { AccountPage } from '../pages/AccountPage';
import { SearchPage } from '../pages/SearchPage';
import { WishlistPage } from '../pages/WishlistPage';

interface PageFixtures {
  productList: ProductListPage;
  productPage: ProductPage;
  cart: CartPage;
  checkout: CheckoutPage;
  account: AccountPage;
  search: SearchPage;
  wishlist: WishlistPage;
}

/** Injeta os Page Objects como fixtures, cada uma só é criada se o teste a declarar como parâmetro. */
export const test = base.extend<PageFixtures>({
  productList: async ({ page }, use) => {
    await use(new ProductListPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cart: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkout: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  account: async ({ page }, use) => {
    await use(new AccountPage(page));
  },
  search: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  wishlist: async ({ page }, use) => {
    await use(new WishlistPage(page));
  },
});

export { expect } from '@playwright/test';
