import { test, expect } from '../fixtures/pages';
import { buildTestAccount } from '../fixtures/test-data';

// CT-040. @creates-account: registra uma conta real para inspecionar o cookie de sessão.
test(
  '"Remember me" define um cookie de sessão com expiração no futuro',
  { tag: '@creates-account' },
  async ({ account }) => {
    const { email, password } = buildTestAccount();

    await account.goto();
    await account.register(email, password);
    await expect.poll(() => account.isLoggedIn()).toBe(true);
    await account.logout();

    await account.goto();
    await account.login(email, password, true);
    await expect.poll(() => account.isLoggedIn()).toBe(true);

    const expiry = await account.getAuthCookieExpiry();
    // Cookie de sessão do navegador tem expires = -1; "Remember me" troca isso
    // por uma data real.
    const oneDayFromNow = Date.now() / 1000 + 24 * 60 * 60;
    expect(expiry).toBeGreaterThan(oneDayFromNow);
  },
);

test(
  'sem "Remember me", o cookie de autenticação é de sessão (expira ao fechar o navegador)',
  { tag: '@creates-account' },
  async ({ account }) => {
    const { email, password } = buildTestAccount();

    await account.goto();
    await account.register(email, password);
    await expect.poll(() => account.isLoggedIn()).toBe(true);
    await account.logout();

    await account.goto();
    await account.login(email, password, false);
    await expect.poll(() => account.isLoggedIn()).toBe(true);

    const expiry = await account.getAuthCookieExpiry();
    expect(expiry).toBe(-1);
  },
);
