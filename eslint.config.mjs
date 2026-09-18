import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'test-results/**', 'playwright-report/**', 'evidence/**'],
  },
  tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },
  {
    rules: {
      // Os Page Objects propositalmente devolvem Locators sem anotar o tipo
      // de retorno em todo método (o próprio TS já infere corretamente);
      // exigir anotação explícita em tudo seria ruído, não segurança extra.
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
);
