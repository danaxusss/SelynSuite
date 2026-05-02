// Root ESLint flat config — minimal shared rules.
// Per-package configs extend this and add framework-specific rules.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.config.{js,mjs,cjs,ts}',
      '**/.docker-data/**',
      '**/next-env.d.ts',
      'packages/ui/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Cardinal Rule R10 — no PII in logs. Reinforced by code review.
      // Cardinal Rule R4 — Money arithmetic. The strict ban on `+ - * /` for
      // Money/Decimal types will be enforced by a custom rule introduced in
      // Phase 3 alongside the Money value object (packages/payroll-engine).
    },
  },
  prettier,
);
