// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "storybook-static", "node_modules"]),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    extends: [
      js.configs.recommended,
      // `tseslint.configs.recommended` já registra o parser e o plugin. A
      // configuração anterior só apontava `tseslint.parser` e pedia
      // `project: true`, o que exigia que todo arquivo lintado estivesse no
      // `tsconfig.json` — `eslint.config.js` e `vite.config.js` não estão.
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // O código ainda carrega bastante `any` vindo das respostas da API.
      // Como aviso, o débito fica visível sem deixar `npm run lint` sempre
      // vermelho — o que faria a equipe ignorar os erros que importam.
      "@typescript-eslint/no-explicit-any": "warn",

      // A regra base do ESLint não entende tipos/enums e acusa falsos
      // positivos em TypeScript; a versão do plugin é a correta.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Arquivos de configuração rodam em Node, não no navegador.
    files: ["*.config.{js,ts}", ".storybook/**/*.{js,ts}"],
    languageOptions: { globals: globals.node },
  },
  {
    // Service worker: escopo próprio (`self`, `importScripts`, `clients`).
    files: ["public/sw.js", "public/*-sw.js"],
    languageOptions: { globals: globals.serviceworker },
  },
  ...storybook.configs["flat/recommended"],
]);
