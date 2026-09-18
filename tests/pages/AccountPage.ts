import { Page } from '@playwright/test';

export class AccountPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/minha-conta/');
  }

  async login(usernameOrEmail: string, password: string, rememberMe = false) {
    await this.page.locator('#username').pressSequentially(usernameOrEmail, { delay: 20 });
    await this.page.locator('#password').pressSequentially(password, { delay: 20 });
    if (rememberMe) {
      await this.page.locator('#rememberme').check();
    }
    await this.page.locator('input[name="login"]').click();
  }

  /** Sem "Remember me" o cookie é de sessão (`expires: -1`). Marcado, ganha data real (CT-040). */
  async getAuthCookieExpiry(): Promise<number> {
    const cookies = await this.page.context().cookies();
    const authCookie = cookies.find((c) => c.name.startsWith('wordpress_logged_in_'));
    if (!authCookie) {
      throw new Error('Cookie de autenticação não encontrado — usuário não está logado.');
    }
    return authCookie.expires;
  }

  async register(email: string, password: string) {
    await this.page.locator('#reg_email').pressSequentially(email, { delay: 20 });
    await this.page.locator('#reg_password').pressSequentially(password, { delay: 20 });
    await this.page.locator('form.register.widget input[name="register"]').click();
  }

  private logoutLink() {
    return this.page.locator('a:visible', { hasText: 'Logout' }).first();
  }

  async logout() {
    await this.logoutLink().click();
  }

  async isLoggedIn(): Promise<boolean> {
    return this.logoutLink().isVisible();
  }

  async requestPasswordReset(usernameOrEmail: string) {
    await this.page.goto('/minha-conta/lost-password/');
    await this.page.locator('#user_login').pressSequentially(usernameOrEmail, { delay: 20 });
    await this.page.locator('form.woocommerce-ResetPassword button[type="submit"]').click();
  }

  /** Mensagens de sucesso e erro compartilham essa área nas páginas de conta. */
  async getNotices(): Promise<string[]> {
    const notices = this.page.locator('.woocommerce-message, .woocommerce-error li');
    await notices.first().waitFor();
    return notices.allInnerTexts();
  }
}
