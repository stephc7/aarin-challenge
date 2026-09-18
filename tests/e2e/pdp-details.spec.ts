import { test, expect } from '../fixtures/pages';

const PRODUCT_SLUG = 'ingrid-running-jacket';

test.describe('Detalhes da PDP', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/product/${PRODUCT_SLUG}/`);
  });

  // CT-004: sem selecionar a variação obrigatória, o botão fica bloqueado via CSS
  // e o clique não adiciona nada ao carrinho — mesmo padrão de falha silenciosa do CT-025.
  test('não adiciona ao carrinho sem selecionar a variação obrigatória', async ({
    productPage,
    cart,
  }) => {
    await expect(productPage.getAddToCartButton()).toHaveClass(/disabled/);

    await productPage.attemptAddToCartWithoutSelection();

    await cart.goto();
    expect(await cart.isEmpty()).toBe(true);
  });

  // CT-026
  test('troca de cor atualiza a imagem principal do produto', async ({ productPage }) => {
    const mainImage = productPage.getMainImage();

    await productPage.selectVariationOption('attribute_size', 'L');
    await productPage.selectVariationOption('attribute_color', 'Red');
    await expect(mainImage).toHaveAttribute('src', /wj04-red/);

    await productPage.selectVariationOption('attribute_color', 'White');
    await expect(mainImage).toHaveAttribute('src', /wj04-white/);
  });

  // CT-027
  test('abas trocam de conteúdo sem sobreposição', async ({ productPage }) => {
    const tabs = ['description', 'additional_information', 'reviews'] as const;

    for (const activeTab of tabs) {
      await productPage.openTab(activeTab);
      await expect(productPage.getTabPanel(activeTab)).toBeVisible();

      const otherTabs = tabs.filter((tab) => tab !== activeTab);
      for (const tab of otherTabs) {
        await expect(productPage.getTabPanel(tab)).toBeHidden();
      }
    }
  });

  // CT-028
  test('produto relacionado leva à PDP correta ao ser clicado', async ({ page, productPage }) => {
    await page.goto('/product/66665692-produto-lgc2/'); 

    const relatedLink = productPage.getRelatedProductLink();
    const expectedTitle = await relatedLink.getAttribute('title');
    const expectedHref = await relatedLink.getAttribute('href');

    await relatedLink.click();
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toBe(expectedHref);
    await expect(page.locator('h1.product_title')).toHaveText(expectedTitle ?? '');
  });

  // CT-029: submissão bloqueada em silêncio pelo JS de validação, sem mensagem de erro.
  test('não publica avaliação sem nota, nome e e-mail', async ({ page, productPage }) => {
    await productPage.submitEmptyReview();
    // Sem sinal observável de que a tentativa terminou; networkidle é o proxy mais confiável.
    // eslint-disable-next-line playwright/no-networkidle -- exceção deliberada, ver comentário acima
    await page.waitForLoadState('networkidle');

    await expect(productPage.getReviewCount()).toHaveCount(0);
    await expect(page.getByText('There are no reviews yet.')).toBeVisible();
  });
});
