import { test, expect } from '../fixtures/pages';
import { parsePrice } from '../utils/price';

function isNonDecreasing(values: number[]): boolean {
  return values.every((value, index) => index === 0 || value >= values[index - 1]);
}

// CT-014
test('ordena produtos por preço (menor para maior)', async ({ productList }) => {
  await productList.goto();

  await productList.sortBy('price');

  const priceTexts = await productList.getDisplayedPrices().allInnerTexts();
  expect(priceTexts.length).toBeGreaterThan(0);
  const prices = priceTexts.map(parsePrice);
  expect(isNonDecreasing(prices)).toBe(true);
});

// CT-022
test('mantém a ordenação por preço ao navegar para a próxima página', async ({
  page,
  productList,
}) => {
  await productList.goto();
  await productList.sortBy('price');

  const pricesPage1 = (await productList.getDisplayedPrices().allInnerTexts()).map(parsePrice);

  await productList.goToPage(2);
  await expect(page).toHaveURL(/orderby=price/);

  const pricesPage2 = (await productList.getDisplayedPrices().allInnerTexts()).map(parsePrice);
  expect(pricesPage2.length).toBeGreaterThan(0);
  expect(isNonDecreasing(pricesPage2)).toBe(true);
  // A ordenação é contínua entre páginas: o primeiro preço da página 2 não
  // pode ser menor que o último preço exibido na página 1.
  expect(pricesPage2[0]).toBeGreaterThanOrEqual(pricesPage1[pricesPage1.length - 1]);
});
