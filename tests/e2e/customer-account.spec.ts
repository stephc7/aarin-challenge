import { test, expect } from '../fixtures/pages';
import { buildTestAccount } from '../fixtures/test-data';

test.describe('Login e conta de cliente', () => {
  // CT-038 — não cria conta: o e-mail usado nunca é registrado.
  test('login com e-mail não cadastrado exibe erro', async ({ account }) => {
    await account.goto();

    await account.login(`nao.cadastrado.${Date.now()}@example.com`, 'qualquerSenha123');

    const notices = await account.getNotices();
    expect(notices.some((n) => n.toLowerCase().includes('desconhecido'))).toBe(true);
    expect(await account.isLoggedIn()).toBe(false);
  });

  // CT-037. @creates-account: registra uma conta real para testar a senha incorreta.
  test(
    'login com senha incorreta exibe erro',
    { tag: '@creates-account' },
    async ({ account }) => {
      const { email, password } = buildTestAccount();

      await account.goto();
      await account.register(email, password);
      await expect.poll(() => account.isLoggedIn()).toBe(true);
      await account.logout();

      await account.goto();
      await account.login(email, 'SenhaCompletamenteErrada000');

      const notices = await account.getNotices();
      expect(notices.some((n) => n.toLowerCase().includes('incorreta'))).toBe(true);
      expect(await account.isLoggedIn()).toBe(false);
    },
  );

  // CT-017. @creates-account: registra uma conta real para depois tentar duplicá-la.
  test(
    'cadastro com e-mail já existente exibe erro',
    { tag: '@creates-account' },
    async ({ account }) => {
      const { email, password } = buildTestAccount();

      await account.goto();
      await account.register(email, password);
      await expect.poll(() => account.isLoggedIn()).toBe(true);
      await account.logout();

      await account.goto();
      await account.register(email, 'OutraSenhaQualquer!789');

      const notices = await account.getNotices();
      expect(notices.some((n) => n.toLowerCase().includes('já está registrada'))).toBe(true);
      expect(await account.isLoggedIn()).toBe(false);
    },
  );

  // CT-039. @creates-account: registra uma conta real para testar a recuperação de senha.
  test(
    'recuperação de senha com e-mail cadastrado exibe confirmação',
    { tag: '@creates-account' },
    async ({ account }) => {
      const { email, password } = buildTestAccount();

      await account.goto();
      await account.register(email, password);
      await expect.poll(() => account.isLoggedIn()).toBe(true);
      await account.logout();

      await account.requestPasswordReset(email);

      const notices = await account.getNotices();
      expect(
        notices.some((n) => n.toLowerCase().includes('redefinição de senha foi enviado')),
      ).toBe(true);
    },
  );
});
