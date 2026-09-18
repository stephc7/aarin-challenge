/** Produto simples em promoção (-33%), usado quando o teste não precisa de variação. */
export const SIMPLE_PRODUCT = {
  id: '10988',
  name: '[66665692] Produto Lgc2',
};

/** Segundo produto simples, usado nos testes de múltiplos itens no carrinho. */
export const SIMPLE_PRODUCT_2 = {
  id: '10987',
  name: '[73395368] Produto Lgc2',
};

/** E-mail único por chamada (`qa.automation+account.`), ver `buildTestCustomer()`. */
export function buildTestAccount(): { email: string; password: string } {
  return {
    email: `qa.automation+account.${Date.now()}@example.com`,
    password: 'SenhaForte!2026',
  };
}

export interface CustomerBillingData {
  firstName: string;
  lastName: string;
  addressLine1: string;
  city: string;
  state: string;
  postcode: string;
  phone: string;
  email: string;
}

/**
 * Cada execução gera nome/e-mail únicos (`qa.automation+order.<timestamp>`)
 * a loja é compartilhada e "Finalizar Compra" cria um pedido real. Ver
 * README, "Impacto no ambiente compartilhado".
 */
export function buildTestCustomer(): CustomerBillingData {
  const runId = Date.now();
  return {
    firstName: 'QA Automation',
    lastName: `Playwright ${runId}`,
    addressLine1: 'Rua dos Testes, 123',
    city: 'São Paulo',
    state: 'SP',
    postcode: '01000-000',
    phone: '11999999999',
    email: `qa.automation+order.${runId}@example.com`,
  };
}
