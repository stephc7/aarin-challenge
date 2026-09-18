# QA Automation — EBAC Shop

Automação do fluxo de compra da [EBAC Shop](http://lojaebac.ebaconline.art.br/) desenvolvida para o desafio técnico de QA.

- **Fluxo obrigatório (P0):** home → vitrine → PDP com seleção de variação → carrinho → alteração de quantidade → checkout → finalização do pedido.
- **Cobertura adicional:** 41 cenários — carrinho, checkout, métodos de pagamento, conta/login, busca, ordenação, preço promocional, detalhes de PDP, wishlist, "Remember me" e comparador de produtos. Detalhe em [Cobertura dos cenários](#cobertura-dos-cenários).
- **Resposta escrita** ao desafio de investigação: [ver seção dedicada](#desafio-de-investigação).

> ⚠️ Antes de rodar a suíte completa repetidamente, leia [Impacto no ambiente compartilhado](#impacto-no-ambiente-compartilhado) — parte dos testes cria pedidos e contas reais na loja, que não podem ser desfeitos com o acesso deste desafio.

## Índice

- [Para avaliação rápida](#para-avaliação-rápida)
- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e execução](#instalação-e-execução)
- [Impacto no ambiente compartilhado](#impacto-no-ambiente-compartilhado)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Cobertura dos cenários](#cobertura-dos-cenários)
- [Análise de qualidade](#análise-de-qualidade)
- [Bugs encontrados](#bugs-encontrados)
- [Limitações conhecidas](#limitações-conhecidas)
- [Evidências](#evidências)
- [Documentação complementar](#documentação-complementar)
- [Desafio de Investigação](#desafio-de-investigação)

## Para avaliação rápida

```bash
npm install
npx playwright install chromium
npm run test:safe      # 32 testes, sem criar pedidos/contas reais
npm run report          # abre o relatório HTML da última execução
```

Última verificação da suíte `test:safe`: **32/32 passando** (2026-09-18). Os 10 testes que criam pedido/conta real (`@creates-order`/`@creates-account`) foram verificados manualmente ao longo do desenvolvimento — ver [Impacto no ambiente compartilhado](#impacto-no-ambiente-compartilhado) antes de rodá-los novamente.

## Stack

- **[Playwright Test](https://playwright.dev/)** + **TypeScript**
- Page Object Model (`tests/pages/`)
- Fixtures do Playwright para dados de teste e injeção de Page Objects (`tests/fixtures/`)
- ESLint (`typescript-eslint` + `eslint-plugin-playwright`) para lint específico de boas práticas de teste (ver nota sobre TypeScript abaixo)
- Relatório HTML nativo do Playwright + trace e vídeo em caso de falha

## Pré-requisitos

- Node.js 18+
- npm

## Instalação e execução

```bash
npm install
npx playwright install chromium   # baixa o navegador usado nos testes

npm test                # roda a suíte completa (headless) — cria pedidos/contas reais, ver abaixo
npm run test:safe       # roda só os testes sem efeito permanente no ambiente
npm run test:headed     # roda com navegador visível
npm run test:debug      # roda em modo debug (Playwright Inspector)
npm run typecheck       # checagem de tipos TypeScript, sem rodar testes
npm run lint            # ESLint (typescript-eslint + eslint-plugin-playwright)

npm run report          # abre o último relatório HTML gerado
```

> **Nota sobre a versão do TypeScript:** o projeto usa `typescript@5.9.3` — não a versão mais recente disponível (TypeScript 7, a reescrita do compilador em Go). `typescript-eslint` ainda não suporta a v7 (falha em runtime, não é só aviso de peer-dependency), e travar numa 5.x estável e amplamente suportada pelo ecossistema de ferramentas é mais seguro do que perseguir a versão mais nova. O projeto não usa nenhum recurso exclusivo do TypeScript 7.

Por padrão, o Playwright grava **screenshot, vídeo e trace apenas quando um teste falha** (`playwright.config.ts`). Para forçar a captura completa em uma execução bem-sucedida (útil para gerar evidências), rode:

```bash
npx playwright test --trace on
```

## Impacto no ambiente compartilhado

A EBAC Shop é uma loja WooCommerce real e **compartilhada**, uma execução completa da suíte **cria dados permanentes** nela:

| O que é criado | Quantos por execução completa | Testes |
|---|---|---|
| Pedidos reais (COD/bacs/cheque) | 5 | `purchase-flow`, `payment-methods` (×2), `checkout-double-submit`, `checkout-create-account` |
| Contas de cliente reais | 6 | `checkout-create-account`, `customer-account` (×3), `remember-me` (×2) |

*(Tabela não exaustiva: `wishlist.spec.ts` e `product-compare.spec.ts` também gravam dados no banco, item na lista de desejos, produto no comparador, mas ligados à sessão/cookie do visitante, não a um pedido ou conta permanente. Não têm tag própria porque o impacto é de outra natureza: não ficam associados a uma identidade nem aparecem como "pedido"/"cliente" pra quem administra a loja.)*

**Isso não pode ser desfeito com o acesso que este desafio oferece.** Verificado: não há "excluir conta" nem cancelamento de pedido self-service em "Minha Conta", e o acesso ao admin do WooCommerce está fora de escopo (ver análise de escopo).

O que foi feito para mitigar isso:
- **Todo dado gerado tem prefixo identificável** (`qa.automation+order.<timestamp>@example.com` / `qa.automation+account.<timestamp>@example.com`), para que quem administra o ambiente consiga pelo menos encontrar e filtrar esse lixo depois.
- **Os testes que criam pedido/conta real têm a tag `@creates-order` e/ou `@creates-account`.** Para rodar só os testes que não deixam rastro permanente:

```bash
npm run test:safe
# equivalente a: npx playwright test --grep-invert "@creates-order|@creates-account"
```

**Por que não há CI configurado:** rodar esta suíte automaticamente a cada push, sem uma loja dedicada/sandbox ou acesso admin para teardown, geraria pedidos e contas indefinidamente num ambiente que não é nosso. Numa situação real (não desafio), a solução correta seria uma das duas: (a) uma instância WooCommerce isolada só para a automação, com reset entre execuções, ou (b) acesso a uma API admin para apagar os dados de teste (por prefixo) ao final de cada run. Nenhuma das duas está disponível aqui, por isso a suíte foi projetada para rodar sob demanda, não em pipeline.

## Estrutura do projeto

```
tests/
  e2e/
    purchase-flow.spec.ts        # fluxo obrigatório (P0): home -> ... -> pedido finalizado
    simple-product.spec.ts       # CT-002: produto simples direto pela vitrine
    cart-management.spec.ts      # CT-008 (remover item) e CT-016 (cupom inválido)
    checkout-validation.spec.ts  # CT-011 (campos obrigatórios) e CT-033 (e-mail inválido)
    payment-methods.spec.ts      # bacs e cheque, finalizando o pedido de ponta a ponta
    customer-account.spec.ts     # login, cadastro e recuperação de senha
    checkout-create-account.spec.ts  # CT-034: criar conta durante o checkout
    search.spec.ts                   # CT-013/CT-041: busca com e sem resultados
    invalid-quantity.spec.ts         # CT-025 (PDP) e CT-032 (carrinho)
    cart-multiple-items.spec.ts      # CT-030 (múltiplos itens) e CT-031 (persistência)
    checkout-double-submit.spec.ts   # CT-036: duplo clique em "Finalizar Compra"
    product-sorting.spec.ts          # CT-014 (ordenar por preço) e CT-022 (persistência ao paginar)
    promotional-price.spec.ts        # CT-024: preço promocional de/por na vitrine
    pdp-details.spec.ts              # CT-004, CT-026, CT-027, CT-028, CT-029: detalhes e validações da PDP
    site-navigation.spec.ts          # CT-019, CT-020, CT-021, CT-023: navegação e vitrine
    wishlist.spec.ts                 # CT-015 (adicionar) e CT-042 (remover) da lista de desejos
    remember-me.spec.ts              # CT-040: "Remember me" via expiração do cookie de sessão
    product-compare.spec.ts          # CT-043: estrutura da tabela do comparador
  pages/
    ProductListPage.ts      # vitrine de produtos (home)
    ProductPage.ts          # PDP: seleção de variação, quantidade, add to cart
    CartPage.ts             # carrinho: atualizar quantidade, totais, ir para checkout
    CheckoutPage.ts         # checkout: dados de cobrança, pagamento, finalizar pedido
    AccountPage.ts          # minha conta: login, cadastro, recuperação de senha
    SearchPage.ts            # busca de produtos pelo header
    WishlistPage.ts          # lista de desejos: adicionar/remover item
  fixtures/
    test-data.ts            # geração de dados de cliente/conta únicos por execução
    pages.ts                # fixture do Playwright que injeta os Page Objects nos testes
  utils/
    price.ts                # parsePrice()/formatPrice() compartilhados entre specs
docs/
  decisoes-tecnicas.md       # decisões de implementação e por quê (achados do ambiente real)
  casos-de-teste.md          # matriz dos cenários automatizados: prioridade e tipo
playwright.config.ts
eslint.config.mjs
evidence/                   # screenshot, vídeo e relatório HTML de uma execução real
```

O design segue Page Object Model: cada página expõe **ações de negócio** (`selectFirstAvailableVariation()`, `updateQuantity()`, `placeOrder()`) em vez de expor seletores brutos para o teste, o que mantém o `.spec.ts` legível como uma descrição do fluxo e concentra a manutenção de seletores em um único lugar por página.

Os Page Objects são injetados via **fixture do Playwright** (`tests/fixtures/pages.ts`) em vez de cada teste escrever `const cart = new CartPage(page);`: um teste que precisa do carrinho e do checkout simplesmente declara `async ({ cart, checkout }) => { ... }`. Isso elimina a repetição desse boilerplate nos 18 arquivos de spec e evita instanciar um Page Object que o teste não usa (o Playwright só cria a fixture quando ela é declarada como parâmetro).

Os achados de comportamento do ambiente real que motivaram decisões específicas de implementação (seletores, esperas, timings) estão documentados em [`docs/decisoes-tecnicas.md`](./docs/decisoes-tecnicas.md).

## Cobertura dos cenários

**41 cenários** da análise de escopo estão automatizados, cobrindo o fluxo obrigatório e casos adicionais de carrinho, checkout, conta, busca, ordenação, preço promocional, PDP, wishlist, "Remember me" e comparador de produtos. Para prioridade (P0/P1/P2) e tipo de cada um, ver [`docs/casos-de-teste.md`](./docs/casos-de-teste.md).

| ID (ref. à base de Casos de Teste) | Cenário | Onde |
|---|---|---|
| CT-001 | Acessar a home e validar carregamento | `purchase-flow.spec.ts` (passo 1) |
| CT-004 | Não adicionar ao carrinho sem selecionar a variação obrigatória | `pdp-details.spec.ts` |
| CT-003 | Selecionar produto variável na vitrine ("Ver opções") → PDP | passo 2 |
| CT-005 | Selecionar variação válida e adicionar ao carrinho | passo 3 |
| CT-006 | Item aparece corretamente no carrinho | passo 4 |
| CT-007 | Alterar quantidade no carrinho e validar recálculo do subtotal/total | passo 5 |
| CT-010 | Resumo do pedido no checkout | passo 6 (implícito na navegação) |
| CT-012 | Finalizar o pedido com dados válidos até onde o ambiente permite | passo 7 |
| CT-002 | Adicionar produto simples ao carrinho direto pela vitrine (sem PDP) | `simple-product.spec.ts` |
| CT-008 | Remover um item do carrinho | `cart-management.spec.ts` |
| CT-016 | Aplicar cupom de desconto inválido e validar que o total não muda | `cart-management.spec.ts` |
| — | Aplicar cupom de desconto válido (EBAC10) e validar 10% de desconto no total | `cart-management.spec.ts` |
| CT-011 | Tentar finalizar o pedido com campos obrigatórios em branco | `checkout-validation.spec.ts` |
| CT-033 | Validar mensagem de erro para e-mail em formato inválido no checkout | `checkout-validation.spec.ts` |
| — | Finalizar pedido com pagamento via transferência bancária (bacs) | `payment-methods.spec.ts` |
| — | Finalizar pedido com pagamento via cheque | `payment-methods.spec.ts` |
| CT-038 | Login com e-mail não cadastrado exibe erro | `customer-account.spec.ts` |
| CT-037 | Login com senha incorreta exibe erro | `customer-account.spec.ts` |
| CT-017 | Cadastro com e-mail já existente exibe erro | `customer-account.spec.ts` |
| CT-039 | Recuperação de senha com e-mail cadastrado exibe confirmação | `customer-account.spec.ts` |
| CT-025 | Quantidade 0 ou negativa na PDP não adiciona o item ao carrinho | `invalid-quantity.spec.ts` |
| CT-032 | Quantidade inválida no carrinho (0 remove; negativa não corrompe o total) | `invalid-quantity.spec.ts` |
| CT-030 | Dois produtos diferentes no carrinho, com subtotais e total corretos | `cart-multiple-items.spec.ts` |
| CT-031 | Itens do carrinho persistem ao navegar entre páginas | `cart-multiple-items.spec.ts` |
| CT-036 | Duplo clique em "Finalizar Compra" gera apenas um pedido | `checkout-double-submit.spec.ts` |
| CT-009 | Bloquear acesso direto ao checkout com carrinho vazio (redireciona ao carrinho) | `checkout-validation.spec.ts` |
| CT-034 | Criar conta durante o checkout e logar depois com os dados informados | `checkout-create-account.spec.ts` |
| CT-013 | Buscar um termo existente e validar resultados | `search.spec.ts` |
| CT-041 | Buscar um termo inexistente e validar mensagem de "nenhum resultado" | `search.spec.ts` |
| CT-014 | Ordenar produtos por preço (menor para maior) | `product-sorting.spec.ts` |
| CT-022 | Ordenação por preço se mantém ao navegar para a página seguinte | `product-sorting.spec.ts` |
| CT-024 | Preço promocional (de/por) exibido corretamente na vitrine, com desconto batendo com o selo | `promotional-price.spec.ts` |
| CT-026 | Troca de cor na PDP atualiza a imagem principal exibida | `pdp-details.spec.ts` |
| CT-027 | Abas da PDP (Descrição/Informação adicional/Avaliações) trocam de conteúdo sem sobreposição | `pdp-details.spec.ts` |
| CT-028 | Produto relacionado leva à PDP correta ao ser clicado | `pdp-details.spec.ts` |
| CT-029 | Avaliação sem nota/nome/e-mail não é publicada | `pdp-details.spec.ts` |
| CT-020 | Mini-carrinho do header atualiza em tempo real, sem reload | `site-navigation.spec.ts` |
| CT-021 | Navegação entre páginas de resultados não repete nem perde produtos | `site-navigation.spec.ts` |
| CT-019 | Links do menu principal (Home, Comprar) levam às páginas corretas | `site-navigation.spec.ts` |
| CT-023 | Quick View exibe os dados corretos sem sair da listagem | `site-navigation.spec.ts` |
| CT-015 | Adicionar um produto à lista de desejos e validar que aparece nela | `wishlist.spec.ts` |
| CT-042 | Remover um item da lista de desejos | `wishlist.spec.ts` |
| CT-040 | "Remember me" mantém a sessão (cookie com expiração real, não de sessão) | `remember-me.spec.ts` |
| CT-043 | Comparador: uma coluna por produto adicionado; remover tira a coluna correspondente | `product-compare.spec.ts` |

O teste do fluxo obrigatório (`completa o fluxo de home até a confirmação do pedido`) é dividido em `test.step()` correspondentes aos 7 passos do desafio, o que faz o relatório HTML exibir cada etapa de forma independente.

## Análise de qualidade

### Cenários mais críticos e por quê

A priorização seguiu **impacto financeiro e integridade de dados**, não cobertura por área da aplicação. Em ordem:

1. **O fluxo obrigatório completo (P0).** É o caminho de receita da loja, qualquer quebra significa zero vendas, então é o único conjunto de cenários que precisa estar 100% correto antes de qualquer outra coisa.
2. **Cálculo de subtotal/total ao alterar quantidade no carrinho (CT-007).** Erro de cálculo é o bug mais caro que existe num checkout: cobrar o valor errado tem implicação financeira direta e, dependendo da direção do erro, legal.
3. **Duplo clique em "Finalizar Compra" não gera pedido duplicado (CT-036).** Baixa probabilidade de acontecer, mas altíssimo custo quando acontece, pedido/cobrança duplicada gera estorno, ticket de suporte e perda de confiança.
4. **Bloqueios de estado inválido (CT-004, CT-025, CT-032, CT-009).** Sem variação selecionada, com quantidade inválida ou carrinho vazio, o sistema não pode deixar passar um pedido com dados incoerentes. O risco não é a compra falhar na hora, é a compra ser aceita com dados corrompidos, que é pior porque só aparece depois, na operação.
5. **Método de pagamento refletido corretamente na confirmação** (`payment-methods.spec.ts`). Cliente e financeiro precisam confiar que o que foi cobrado bate com o que ficou registrado.

Busca, ordenação, wishlist, comparador e Quick View foram automatizados mas são de criticidade mais baixa: uma falha ali degrada experiência, não gera prejuízo financeiro nem corrompe dado de pedido.

### Riscos identificados durante o mapeamento

**Riscos de produto** (comportamentos da própria aplicação):
- **Falhas silenciosas sem feedback ao usuário** (quantidade inválida na PDP, avaliação incompleta, variação não selecionada). O comportamento em si está correto, mas o usuário não sabe por que nada aconteceu — gera suporte e frustração. Também é um risco para a automação: sem erro visível, o teste depende de um proxy mais fraco (`networkidle`) para confirmar "nada aconteceu" (ver [Limitações conhecidas](#limitações-conhecidas)).
- **Enumeração de contas via mensagens de erro de login/cadastro.** Mensagens diferentes para "e-mail não existe" vs. "senha errada" vs. "e-mail já cadastrado" permitem descobrir se um e-mail está cadastrado na base. É uma exposição de segurança, registrada como achado de qualidade e fora do escopo funcional do desafio.

**Riscos de processo**, específicos de testar contra este ambiente:
- **A loja é real, pública e compartilhada.** Qualquer execução da suíte cria pedidos e contas permanentes, sem forma de limpar depois (ver [Impacto no ambiente compartilhado](#impacto-no-ambiente-compartilhado)). Rodar a suíte sem cuidado (ex.: em CI, a cada push) acumula dado permanente indefinidamente num ambiente que não é nosso.
- **Acoplamento a itens específicos do catálogo.** A suíte depende de produtos e estados exatos que outro candidato ou quem administra a loja podem alterar a qualquer momento, quebrando testes sem que exista bug real na aplicação (ver [Limitações conhecidas](#limitações-conhecidas)).
- **Sem acesso a admin/API.** Não há como confirmar o estado do pedido do lado do servidor além do que a UI mostra, nem fazer teardown. Isso limita a suíte a validações client-side; uma regressão puramente server-side ficaria invisível para esta automação.

### O que decidi testar e o que decidi não testar

**Testamos:** o fluxo obrigatório completo e os cenários funcionais listados em [Cobertura dos cenários](#cobertura-dos-cenários), carrinho, checkout, contas, busca, ordenação, PDP, wishlist, comparador, priorizados pelo critério de criticidade acima.

**Decidi não testar, conscientemente:**

- **Carregamento de banners/carrossel da home sem quebrar o layout.** É um cenário fundamentalmente visual: uma asserção funcional (ex.: "o elemento existe") não prova ausência de quebra de layout, e regressão visual de verdade (screenshot diff) é uma categoria de ferramenta e de esforço diferente do que este desafio pede.
- **Cross-browser e cross-device.** A suíte roda só em Chromium desktop. Dado o prazo sugerido do desafio (3 dias) e que o objetivo é validar lógica de negócio (não CSS responsivo ou diferenças de engine), julguei que o ganho de rodar em Firefox/WebKit ou em viewports mobile não justificava o tempo, mas é a primeira extensão óbvia se o projeto continuasse.
- **Performance, acessibilidade e segurança aprofundada.** Fora de escopo por definição do desafio (QA funcional de frontend). O único achado de segurança (enumeração de contas via mensagens de erro, ver acima) foi incidental, encontrado testando funcionalidade, não por um exercício de pentest.
- **Qualquer validação a nível de API/backend.** O desafio dá acesso apenas à aplicação como um usuário real teria, sem credenciais de admin ou API. Toda a suíte testa através da UI, o mesmo tipo de acesso que o cenário do [Desafio de Investigação](#desafio-de-investigação) descreve para um QA em produção.

## Bugs encontrados

**BUG-001 — Campo de quantidade do carrinho não reverte visualmente após valor negativo rejeitado** (Severidade: Baixa, Prioridade: P2, relacionado a CT-032):

- **Passos para reproduzir:**
  1. Acessar a PDP de "Ingrid Running Jacket" e selecionar uma variação disponível em estoque (ex.: Size=L, Color=Orange)
  2. Clicar em "Comprar" (quantidade padrão = 1)
  3. Acessar `/carrinho/`
  4. No campo de quantidade do item, apagar o valor e digitar `-3`
  5. Disparar o evento de `change` do campo (sair do campo/tab)
  6. Clicar em "Update Cart"
  7. Observar o campo de quantidade e o total **sem recarregar a página**
- **Resultado esperado:** o sistema rejeita o valor negativo e reverte o campo visualmente para a última quantidade válida (1).
- **Resultado obtido:** o total permanece correto (R$84,00 — o servidor rejeitou a atualização), mas o campo de quantidade continua mostrando `-3` na tela. Só ao recarregar a página manualmente (F5) o campo volta a exibir o valor real (1) persistido no servidor.
- **Evidência:** reproduzido via automação Playwright (`tests/e2e/invalid-quantity.spec.ts`, teste "Carrinho: quantidade negativa não corrompe o total" — a asserção de total passa propositalmente porque o cálculo está correto, o bug é especificamente a divergência visual do campo).

## Limitações conhecidas

Além do impacto no ambiente ([acima](#impacto-no-ambiente-compartilhado)), outras limitações estruturais desta suíte:

- **Acoplamento a itens específicos do catálogo compartilhado.** A suíte depende de produtos e estados exatos que não são controlados: `SIMPLE_PRODUCT` (10988) precisa continuar "vendido individualmente"; `SIMPLE_PRODUCT_2` (10987) e o próprio `SIMPLE_PRODUCT` precisam continuar existindo no catálogo; "Ingrid Running Jacket" precisa manter as mesmas variações de Tamanho/Cor com pelo menos uma combinação em estoque. Isso é uma fragilidade inerente a testar contra um catálogo de dados que não é nosso, não um problema da automação em si, mas o *sintoma* foi mitigado (falha confusa e tardia): `ProductListPage` valida a existência do produto antes de interagir com ele, `ProductPage.selectFirstAvailableVariation()` valida a disponibilidade de variações, e a asserção de "vendido individualmente" tem mensagem customizada, todos apontando para esta seção em vez de um timeout genérico do Playwright. O teste de preço promocional (CT-024) não depende de um produto específico: descobre dinamicamente o primeiro item em promoção na vitrine.
- **Vários pontos da aplicação falham em silêncio, sem nenhum sinal observável de que algo deu errado** (quantidade inválida na PDP, avaliação incompleta), os testes correspondentes usam `waitForLoadState('networkidle')` como proxy de "nada aconteceu" em vez de aguardar uma mensagem de erro que não existe. É o padrão de espera mais fraco desta suíte: depende de timing de rede em vez de um estado da UI, então é o primeiro lugar a olhar se algum desses testes ficar flaky no futuro.
- **Sem CI configurado** — motivo detalhado em [Impacto no ambiente compartilhado](#impacto-no-ambiente-compartilhado).

## Evidências

A pasta [`evidence/`](./evidence) contém:
- `checkout-flow-final-screenshot.png` e `checkout-flow-execution.webm` — confirmação de um pedido real gerado pela automação.
- `html-report/` — relatório HTML do Playwright, atualizado com os 32 testes que **não** criam pedido/conta real (`npm run test:safe`; abra `evidence/html-report/index.html` no navegador). Os 10 testes que criam dados reais (`@creates-order`/`@creates-account`) não são regerados a cada atualização de evidência.
- `last-run-console-output.txt` — saída de terminal correspondente a essa mesma execução (32 testes).

## Documentação complementar

- [`docs/decisoes-tecnicas.md`](./docs/decisoes-tecnicas.md) — todas as decisões de implementação motivadas por comportamentos do ambiente real (seletores, esperas, timings), com o raciocínio completo por trás de cada uma.
- [`docs/casos-de-teste.md`](./docs/casos-de-teste.md) — matriz dos 41 cenários automatizados com prioridade (P0/P1/P2) e tipo.

---

## Desafio de Investigação

> **Cenário:** "Às vezes, o cliente paga, mas o pedido não aparece na tela de 'Meus Pedidos'." Sem acesso ao código-fonte, apenas ambiente de produção, logs básicos e apoio dos times de Produto e Backend.
>
> **Pergunta:** Qual seria sua primeira ação para investigar esse problema e por quê? Detalhe sua hipótese inicial e como reduziria a incerteza rapidamente.

**Primeira ação:** antes de investigar qualquer coisa mais a fundo, eu procuraria por **2 ou 3 casos concretos e recentes**, número do pedido (se houver algum), e-mail do cliente, forma de pagamento e horário aproximado da compra.

**Hipótese inicial:** o pedido existe no backend (mesmo que com status ou dono errado), ou ele nunca chegou a ser criado. Cada resposta aponta pra uma classe de bug diferente.

**Como eu reduziria a incerteza rapidamente:** cruzando evidência em ordem, do acesso mais direto (o que já tenho, segundo o enunciado) para o que depende de outros times:

1. **Logs da própria aplicação**, primeiro, buscar por e-mail/horário no log de checkout: existe uma tentativa de criação de pedido registrada naquele horário? Tem algum erro logado na chamada ao gateway ou no processamento pós-pagamento (timeout, exceção, resposta 4xx/5xx)? Isso já separa "nada foi registrado do lado da aplicação" de "algo foi registrado, mas quebrou depois".
2. **Painel do gateway de pagamento** (Stripe/PagSeguro/Mercado Pago etc.), em seguida confirmar que o dinheiro realmente saiu, que "o cliente pagou" é realmente um fato. Se eu não tiver acesso direto a esse painel, acionaria o time de Financeiro pra puxar esse mesmo dado.
3. **Tabela de pedidos no backend**, por último, com apoio do time de Backend, buscar por e-mail, horário aproximado e (se existir) ID de transação do gateway, procurando *qualquer* registro na janela de tempo (incluindo `pending`, `failed`, `cancelled`), não só o status "visível" em Meus Pedidos.

Essa ordem evita mobilizar dois times em paralelo antes de saber se o problema já está visível no log mais acessível (o meu) ou realmente precisa de investigação cruzada entre Pagamentos e Backend.

**Por que essa hipótese binária vem primeiro:** ela separa dois tipos de bug completamente diferentes, cada um com dono e caminho de investigação distintos:

- **O pedido existe no backend, mas não aparece para o cliente.** Aponta para um problema de *associação/exibição*, ex.: pedido criado como "guest" com e-mail digitado diferente do e-mail da conta logada, sessão trocada, filtro de status na query de "Meus Pedidos" excluindo o status em que o pedido ficou. É um bug geralmente mais rápido de corrigir e sem risco financeiro adicional.
- **O pedido não existe em lugar nenhum do backend**, apesar do pagamento capturado no gateway. Aponta para uma falha no **webhook/callback de confirmação de pagamento** (o gateway processou e tentou notificar o backend, mas a notificação falhou, expirou ou a sessão de checkout já havia caído quando ela chegou). Esse é o cenário mais crítico: dinheiro saiu e não há pedido correspondente, o que exige tanto correção técnica quanto tratamento manual (reembolso ou criação retroativa do pedido) para aquele cliente específico.

Essa checagem normalmente já indica em minutos qual das duas frentes investigar, evitando o desperdício de vasculhar logs de aplicação inteiros sem saber se o problema é de exibição, de vínculo de conta ou de integração com o pagamento.
