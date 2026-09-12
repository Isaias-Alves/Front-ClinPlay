import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import svgr from "vite-plugin-svgr";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const src = (sub: string) => path.resolve(dirname, "../src", sub);

/**
 * Os aliases precisam espelhar os de `vite.config.js`, caso contrário as
 * stories que importam `@components`/`@contexts` quebram dentro do Storybook.
 */
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
  ],
  framework: { name: "@storybook/react-vite", options: {} },
  async viteFinal(config) {
    config.plugins = [...(config.plugins ?? []), svgr()];
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": src(""),
      "@components": src("components"),
      "@contexts": src("contexts"),
      "@games": src("games"),
      "@hooks": src("hooks"),
      "@utils": src("utils"),
      "@assets": src("assets"),
      "@pages": src("pages"),
      "@services": src("services"),
      "@interfaces": src("interfaces"),
    };
    return config;
  },
};

export default config;
