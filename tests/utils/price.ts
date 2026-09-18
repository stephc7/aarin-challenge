/**
 * Extrai o valor monetário vigente de um texto de preço do WooCommerce.
 *
 * Quando há promoção, o bloco de preço concatena o valor riscado (de) e o
 * valor atual (por). ex. "R$1.500,00R$1.000,00" — e o último valor
 * encontrado é sempre o vigente, que é também o que o WooCommerce usa para
 * ordenar. Para um preço isolado (sem promoção) o resultado é o mesmo valor,
 * então esta função cobre os dois casos sem precisar de uma variante "simples".
 */
export function parsePrice(text: string): number {
  const matches = text.match(/[\d.,]+/g);
  if (!matches) return NaN;
  const last = matches[matches.length - 1];
  return Number(last.replace(/\./g, '').replace(',', '.'));
}

export function formatPrice(value: number): string {
  return `R$${value.toFixed(2).replace('.', ',')}`;
}
