/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  define: {
    global: "window",
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
      "@components": path.resolve(dirname, "./src/components"),
      "@hooks": path.resolve(dirname, "./src/hooks"),
      "@utils": path.resolve(dirname, "./src/utils"),
      "@assets": path.resolve(dirname, "./src/assets"),
      "@services": path.resolve(dirname, "./src/services"),
      "@interfaces": path.resolve(dirname, "./src/interfaces"),
      "@contexts": path.resolve(dirname, "./src/contexts"),
      "@games": path.resolve(dirname, "./src/games"),
    },
  },

  build: {
    rollupOptions: {
      output: {
        /**
         * O bundle de entrada passava de 500 kB porque React, o router e o
         * framer-motion iam juntos com o código da aplicação. Separados, o
         * navegador guarda em cache as bibliotecas entre deploys e só volta
         * a baixar o que de facto mudou — relevante numa app mobile-first
         * usada em rede móvel.
         */
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          animacoes: ["framer-motion"],
          rede: ["axios", "@stomp/stompjs", "sockjs-client"],
        },
      },
    },
  },

  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
