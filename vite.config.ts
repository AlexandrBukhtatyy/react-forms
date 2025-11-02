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
    watch: false, // tests end after execution, they don't keep "watching"
    include: ['./src/tests/*.{test,spec}.?(c|m)[jt]s?(x)'], // we will write all our tests in a /tests folder
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.mjs', '.json', '.ts', '.tsx'],
  },
};

export default defineConfig(config);


/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import type { InlineConfig } from 'vitest/node';
import type { UserConfig } from 'vite';
import react from '@vitejs/plugin-react';

