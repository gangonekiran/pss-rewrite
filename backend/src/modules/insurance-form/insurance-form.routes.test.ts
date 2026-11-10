import { describe, expect, it, vi } from 'vitest';

import router from './insurance-form.routes.js';
import * as controller from './insurance-form.controller.js';

vi.mock('./insurance-form.controller.js', () => ({
  get: vi.fn(),
  getOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  options: vi.fn(),
}));

function findRoute(method: string, path: string) {
  const layer = router.stack.find(
    (item) => item.route?.path === path && item.route.stack[0].method === method,
  );

  return layer?.route?.stack[0].handle;
}

describe('Insurance Form Routes', () => {
  it.each([
    ['get', '/lookups/options', 'options'],
    ['get', '/:childId', 'get'],
    ['post', '/:childId', 'create'],
    ['get', '/:childId/:id', 'getOne'],
    ['put', '/:childId/:id', 'update'],
    ['delete', '/:childId/:id', 'remove'],
  ] as const)('%s %s uses controller.%s', (method, path, handler) => {
    expect(findRoute(method, path)).toBe(controller[handler]);
  });

  it('registers /lookups/options before /:childId', () => {
    const paths = router.stack.filter((layer) => layer.route).map((layer) => layer.route?.path);

    expect(paths.indexOf('/lookups/options')).toBeLessThan(paths.indexOf('/:childId'));
  });

  it('only has six routes', () => {
    expect(router.stack.filter((layer) => layer.route)).toHaveLength(6);
  });
});
