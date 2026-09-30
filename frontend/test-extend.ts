// test-extend.ts
import { test as testBase } from 'vitest';
import { worker } from './src/mocks/browser.ts';

export const test = testBase.extend({
  worker: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      // Start the worker before the test.
      await worker.start();

      // Expose the worker object on the test's context.
      await use(worker);

      // Remove any request handlers added in individual test cases.
      // This prevents them from affecting unrelated tests.
      worker.resetHandlers();
    },
    {
      auto: true,
    },
  ],
});