// This file has been automatically migrated to valid ESM format by Storybook.
/** @type { import('@storybook/react-vite').StorybookConfig } */
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import svgr from "vite-plugin-svgr";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(config) {
    config.plugins = [...(config.plugins || []), svgr()];
    config.resolve.alias = {
      ...config.resolve.alias,
      "@hooks": path.resolve(__dirname, "../src/hooks"),
      "@utils": path.resolve(__dirname, "../src/utils"),
      "@assets": path.resolve(__dirname, "../src/assets"),
      "@services": path.resolve(__dirname, "../src/services"),
      "@components": path.resolve(__dirname, "../src/components"),
    };
    return config;
  },
};
export default config;
