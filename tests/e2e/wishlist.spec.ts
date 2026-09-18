import { test, expect } from '../fixtures/pages';
import { SIMPLE_PRODUCT } from '../fixtures/test-data';

test.describe('Lista de desejos', () => {
  test.beforeEach(async ({ page, productList }) => {
    await page.goto('/');
    await productList.addToWishlist(SIMPLE_PRODUCT.id);
  });

  // CT-015
  test('adiciona um produto e ele aparece na lista de desejos', async ({ wishlist }) => {
    await wishlist.goto();

    await expect(wishlist.hasProduct(SIMPLE_PRODUCT.name)).toBeVisible();
  });

  // CT-042
  test('remove um item da lista de desejos', async ({ wishlist }) => {
    await wishlist.goto();
    await expect(wishlist.hasProduct(SIMPLE_PRODUCT.name)).toBeVisible();

    await wishlist.removeProduct(SIMPLE_PRODUCT.name);

    await expect.poll(() => wishlist.isEmpty()).toBe(true);
  });
});
