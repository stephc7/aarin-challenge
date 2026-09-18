import { test, expect } from '../fixtures/pages';

test.describe('Busca de produtos', () => {
  // CT-013
  test('busca por um termo existente retorna resultados relacionados', async ({ page, search }) => {
    await page.goto('/');

    await search.search('Jacket');

    await expect(page).toHaveURL(/[?&]s=Jacket/);
    expect(await search.getResults().count()).toBeGreaterThan(0);
  });

  // CT-041
  test('busca por um termo inexistente exibe mensagem de nenhum resultado', async ({
    page,
    search,
  }) => {
    await page.goto('/');

    await search.search('xyzinexistente999');

    await expect(search.getResults()).toHaveCount(0);
    await expect(search.getNoResultsMessage()).toContainText('Nenhum produto foi encontrado');
  });
});
