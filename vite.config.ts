/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import type { UserConfig } from 'vite';
import type { InlineConfig } from 'vitest/node';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

type ViteConfig = UserConfig & { test: InlineConfig }

// https://vite.dev/config/
const config: ViteConfig = {
  plugins: [
    react({
			babel: {
				plugins: [['module:@preact/signals-react-transform']],
			}
    }),
    tailwindcss()
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/Setup.ts'],
    globals: true,
    watch: false,

    // Разные конфигурации для разных типов тестов
    include: [
      './src/tests/unit/**/*.test.{ts,tsx}',
      './src/tests/integration/**/*.integration.test.{ts,tsx}',
    ],

    // E2E тесты отдельно (запускаются через npm run test:e2e)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      './src/tests/e2e/**',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts', 'src/domains/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/**',
        '**/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './src/tests'),
    },
    extensions: ['.js', '.mjs', '.json', '.ts', '.tsx'],
  },
};

export default defineConfig(config);

