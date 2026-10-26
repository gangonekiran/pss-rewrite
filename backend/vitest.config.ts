import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only run the TypeScript sources. dist/ holds compiled CommonJS copies,
    // which Vitest cannot import ("cannot be imported in a CommonJS module").
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
  },
});
