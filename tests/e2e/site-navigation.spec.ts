import { test, expect } from '../fixtures/pages';
import { SIMPLE_PRODUCT } from '../fixtures/test-data';

// CT-020
test('mini-carrinho do header atualiza em tempo real ao adicionar um produto', async ({
  page,
  productList,
}) => {
  await page.goto('/');

  await expect(productList.getCartCount()).toHaveText('0');

  await productList.addSimpleProductToCart(SIMPLE_PRODUCT.id);

  // Sem reload: a URL continua na home, mas o contador já reflete o item
  // adicionado, a atualização é via fragmento AJAX, não navegação.
  await expect(page).toHaveURL('/');
  await expect(productList.getCartCount()).toHaveText('1');
});

// CT-021
test('navegação entre páginas de resultados não repete nem perde produtos', async ({
  productList,
}) => {
  await productList.goto();

  const idsPage1 = await productList.getProductIdsOnPage();
  await productList.goToPage(2);
  const idsPage2 = await productList.getProductIdsOnPage();

  expect(idsPage1.length).toBeGreaterThan(0);
  expect(idsPage2.length).toBeGreaterThan(0);
  const overlap = idsPage1.filter((id) => idsPage2.includes(id));
  expect(overlap).toEqual([]);
});

// CT-019
test.describe('Links do menu principal', () => {
  // O tema duplica o menu (cópia oculta para mobile). ":visible" evita
  // clicar na cópia errada, mesmo padrão de outros controles do tema.
  for (const { label, expectedPath } of [
    { label: 'Home', expectedPath: '/home/' },
    { label: 'Comprar', expectedPath: '/produtos/' },
  ]) {
    test(`"${label}" leva à página correta`, async ({ page }) => {
      await page.goto('/');
      await page.locator('a:visible', { hasText: label }).first().click();
      await expect(page).toHaveURL(new RegExp(`${expectedPath}$`));
    });
  }
});

// CT-023
test('Quick View exibe os dados corretos sem sair da listagem', async ({ page, productList }) => {
  await productList.goto();

  await productList.openQuickView(SIMPLE_PRODUCT.id);

  await expect(page).toHaveURL(/\/produtos\/$/);
  await expect(productList.getQuickViewTitle()).toHaveText(SIMPLE_PRODUCT.name);
  await expect(productList.getQuickViewPrice()).toBeVisible();
});
