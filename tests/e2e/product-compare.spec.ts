import { test, expect } from '../fixtures/pages';
import { SIMPLE_PRODUCT, SIMPLE_PRODUCT_2 } from '../fixtures/test-data';

// CT-043: a tabela não exibe nome/imagem/preço dos produtos (achado de qualidade,
// ver README) — o teste verifica a estrutura observável: colunas por produto.
test('adiciona dois produtos ao comparador e valida a estrutura da tabela', async ({
  page,
  productList,
}) => {
  await page.goto('/');

  await productList.addToCompare(SIMPLE_PRODUCT.id);
  await productList.closeCompareOverlay();

  await productList.addToCompare(SIMPLE_PRODUCT_2.id);
  const frame = productList.getCompareFrame();
  const headerCells = frame
    .locator('table.compare-list')
    .first()
    .locator('thead tr')
    .first()
    .locator('th, td');
  // 1 coluna de rótulo + 1 por produto comparado.
  await expect(headerCells).toHaveCount(3);

  await frame.locator('tbody tr:has-text("Remover") a').first().click();

  await expect(headerCells).toHaveCount(2);
});
