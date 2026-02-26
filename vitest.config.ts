import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

/**
 * Unit tests: main + shared (Node) and renderer (jsdom).
 * Renderer specs use jsdom via @vitest-environment jsdom in the test file.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/main/**/*.spec.ts',
      'src/shared/**/*.spec.ts',
      'src/renderer/**/*.spec.ts',
      'src/renderer/**/*.spec.tsx',
    ],
    exclude: ['**/node_modules/**', '**/out/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/main/**/*.ts', 'src/shared/**/*.ts', 'src/renderer/src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.spec.{ts,tsx}',
        '**/*.d.ts',
        '**/env.d.ts',
        'src/main/index.ts',
        'src/renderer/src/main.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@main': resolve('src/main'),
      '@common': resolve('src/main/common'),
      '@shared': resolve('src/shared'),
      '@renderer': resolve('src/renderer/src'),
      '@assets': resolve('src/renderer/src/assets'),
      'types': resolve('src/types'),
      '@locale': resolve('src/shared/locale'),
    },
  },
});
