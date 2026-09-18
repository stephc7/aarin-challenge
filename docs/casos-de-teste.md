# Casos de teste automatizados

Matriz dos 41 cenários automatizadosncom prioridade e tipo atribuídos pelo mesmo critério de criticidade explicado no README ([Cenários mais críticos e por quê](../README.md#cenários-mais-críticos-e-por-quê)): impacto financeiro e integridade de dados acima de cobertura por área.

- **P0** — bloqueia lançamento se falhar: caminho de receita ou risco de dado corrompido/cobrança errada.
- **P1** — importante, mas não bloqueia: funcionalidade adicional ou caminho alternativo ao obrigatório.
- **P2** — degrada experiência se falhar, sem impacto financeiro ou de integridade de dados.

| ID | Prioridade | Tipo | Cenário | Spec |
|---|---|---|---|---|
| CT-001 | P0 | Happy path | Acessar a home e validar carregamento | `purchase-flow.spec.ts` |
| CT-003 | P0 | Happy path | Selecionar produto variável na vitrine → PDP | `purchase-flow.spec.ts` |
| CT-004 | P0 | Negativo | Não adicionar ao carrinho sem selecionar a variação obrigatória | `pdp-details.spec.ts` |
| CT-005 | P0 | Happy path | Selecionar variação válida e adicionar ao carrinho | `purchase-flow.spec.ts` |
| CT-006 | P0 | Happy path | Item aparece corretamente no carrinho | `purchase-flow.spec.ts` |
| CT-007 | P0 | Happy path | Alterar quantidade no carrinho e validar recálculo do subtotal/total | `purchase-flow.spec.ts` |
| CT-009 | P0 | Negativo | Bloquear acesso direto ao checkout com carrinho vazio | `checkout-validation.spec.ts` |
| CT-010 | P0 | Happy path | Resumo do pedido no checkout | `purchase-flow.spec.ts` |
| CT-012 | P0 | Happy path | Finalizar o pedido com dados válidos até onde o ambiente permite | `purchase-flow.spec.ts` |
| CT-025 | P0 | Negativo | Quantidade 0 ou negativa na PDP não adiciona o item ao carrinho | `invalid-quantity.spec.ts` |
| CT-032 | P0 | Negativo | Quantidade inválida no carrinho (0 remove; negativa não corrompe o total) | `invalid-quantity.spec.ts` |
| CT-036 | P0 | Negativo | Duplo clique em "Finalizar Compra" gera apenas um pedido | `checkout-double-submit.spec.ts` |
| CT-002 | P1 | Happy path | Adicionar produto simples ao carrinho direto pela vitrine (sem PDP) | `simple-product.spec.ts` |
| CT-008 | P1 | Funcional | Remover um item do carrinho | `cart-management.spec.ts` |
| CT-011 | P1 | Validação | Tentar finalizar o pedido com campos obrigatórios em branco | `checkout-validation.spec.ts` |
| CT-016 | P1 | Validação | Aplicar cupom de desconto inválido e validar que o total não muda | `cart-management.spec.ts` |
| — | P1 | Funcional | Aplicar cupom de desconto válido (EBAC10) e validar 10% de desconto no total | `cart-management.spec.ts` |
| CT-024 | P1 | Funcional | Preço promocional (de/por) exibido corretamente na vitrine, com desconto batendo com o selo | `promotional-price.spec.ts` |
| CT-030 | P1 | Funcional | Dois produtos diferentes no carrinho, com subtotais e total corretos | `cart-multiple-items.spec.ts` |
| CT-033 | P1 | Validação | Validar mensagem de erro para e-mail em formato inválido no checkout | `checkout-validation.spec.ts` |
| CT-034 | P1 | Funcional | Criar conta durante o checkout e logar depois com os dados informados | `checkout-create-account.spec.ts` |
| CT-040 | P1 | Segurança/Funcional | "Remember me" mantém a sessão (cookie com expiração real, não de sessão) | `remember-me.spec.ts` |
| — | P1 | Happy path | Finalizar pedido com pagamento via transferência bancária (bacs) | `payment-methods.spec.ts` |
| — | P1 | Happy path | Finalizar pedido com pagamento via cheque | `payment-methods.spec.ts` |
| CT-013 | P2 | Funcional | Buscar um termo existente e validar resultados | `search.spec.ts` |
| CT-014 | P2 | Funcional | Ordenar produtos por preço (menor para maior) | `product-sorting.spec.ts` |
| CT-015 | P2 | Funcional | Adicionar um produto à lista de desejos e validar que aparece nela | `wishlist.spec.ts` |
| CT-017 | P2 | Validação | Cadastro com e-mail já existente exibe erro | `customer-account.spec.ts` |
| CT-019 | P2 | Funcional | Links do menu principal (Home, Comprar) levam às páginas corretas | `site-navigation.spec.ts` |
| CT-020 | P2 | UX | Mini-carrinho do header atualiza em tempo real, sem reload | `site-navigation.spec.ts` |
| CT-021 | P2 | Funcional | Navegação entre páginas de resultados não repete nem perde produtos | `site-navigation.spec.ts` |
| CT-022 | P2 | Funcional | Ordenação por preço se mantém ao navegar para a página seguinte | `product-sorting.spec.ts` |
| CT-023 | P2 | UX | Quick View exibe os dados corretos sem sair da listagem | `site-navigation.spec.ts` |
| CT-026 | P2 | UX | Troca de cor na PDP atualiza a imagem principal exibida | `pdp-details.spec.ts` |
| CT-027 | P2 | UX | Abas da PDP trocam de conteúdo sem sobreposição | `pdp-details.spec.ts` |
| CT-028 | P2 | Funcional | Produto relacionado leva à PDP correta ao ser clicado | `pdp-details.spec.ts` |
| CT-029 | P2 | Validação | Avaliação sem nota/nome/e-mail não é publicada | `pdp-details.spec.ts` |
| CT-031 | P2 | Funcional | Itens do carrinho persistem ao navegar entre páginas | `cart-multiple-items.spec.ts` |
| CT-037 | P2 | Validação | Login com senha incorreta exibe erro | `customer-account.spec.ts` |
| CT-038 | P2 | Validação | Login com e-mail não cadastrado exibe erro | `customer-account.spec.ts` |
| CT-039 | P2 | Funcional | Recuperação de senha com e-mail cadastrado exibe confirmação | `customer-account.spec.ts` |
| CT-041 | P2 | Validação | Buscar um termo inexistente e validar mensagem de "nenhum resultado" | `search.spec.ts` |
| CT-042 | P2 | Funcional | Remover um item da lista de desejos | `wishlist.spec.ts` |
| CT-043 | P2 | Funcional | Comparador: uma coluna por produto adicionado; remover tira a coluna correspondente | `product-compare.spec.ts` |
