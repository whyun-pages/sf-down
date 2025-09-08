import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default ([
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,mts,cts}"],
    ...js.configs.recommended,

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        parser: tseslint.parser,
        project: './tsconfig.json',
        tsconfigRootDir: '.',
      },
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      indent: ['error', 4],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: ['node_modules', 'dist'],
  }

]);
