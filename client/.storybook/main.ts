import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";
import { fileURLToPath } from "url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
  ],
  framework: "@storybook/react-vite",
  viteFinal: async (viteConfig) => {
    const srcPath = path.resolve(__dirname, "../src");
    const mockAuthPath = path.resolve(
      __dirname,
      "../src/stories/mocks/auth-provider.mock.tsx",
    );

    return {
      ...viteConfig,
      resolve: {
        ...viteConfig.resolve,
        // Use array format to guarantee order - first match wins
        alias: [
          // Mock auth-provider FIRST (most specific)
          {
            find: "@/_providers/auth-provider",
            replacement: mockAuthPath,
          },
          // Then the general @ alias
          {
            find: "@",
            replacement: srcPath,
          },
          // Pino browser shim
          {
            find: "pino",
            replacement: "pino/browser.js",
          },
        ],
      },
    };
  },
};
export default config;
