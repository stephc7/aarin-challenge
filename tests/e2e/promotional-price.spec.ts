import { test, expect } from '../fixtures/pages';
import { parsePrice } from '../utils/price';

// CT-024: não depende de qual produto está em promoção, só que exista algum na vitrine.
test('exibe preço promocional (de/por) corretamente na vitrine', async ({ page, productList }) => {
  await page.goto('/');

  // `textContent()` em vez de `innerText()`: a cópia do card pode estar num
  // slot oculto do carrossel, e `innerText()` retorna vazio nesse caso.
  const card = productList.getFirstOnSaleCard();
  await expect(
    card,
    'Nenhum produto em promoção encontrado na vitrine — ver README > Limitações conhecidas',
  ).toHaveCount(1);

  const originalPriceText = await card.locator('.price del .amount').first().textContent();
  const salePriceText = await card.locator('.price ins .amount').first().textContent();
  const badgeText = await card.locator('.onsale').textContent();

  const originalPrice = parsePrice(originalPriceText ?? '');
  const salePrice = parsePrice(salePriceText ?? '');
  const badgePercent = Number((badgeText ?? '').replace(/[^\d]/g, ''));

  expect(salePrice).toBeLessThan(originalPrice);
  const actualDiscountPercent = ((originalPrice - salePrice) / originalPrice) * 100;
  // Tolerância de 1pp cobre o arredondamento do selo sem mascarar um desconto errado.
  expect(Math.abs(actualDiscountPercent - badgePercent)).toBeLessThanOrEqual(1);
});
