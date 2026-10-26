import { describe, expect, it, vi } from 'vitest';

import router from './exit-form.routes';
import * as controller from './exit-form.controller';

vi.mock('./exit-form.controller', () => ({
  get: vi.fn(),
  getOne: vi.fn(),
  defaults: vi.fn(),
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

describe('Exit Form Routes', () => {
  it('should have GET /lookups/options', () => {
    expect(findRoute('get', '/lookups/options')).toBe(controller.options);
  });

  it('should have GET /:childId', () => {
    expect(findRoute('get', '/:childId')).toBe(controller.get);
  });

  it('should have POST /:childId', () => {
    expect(findRoute('post', '/:childId')).toBe(controller.create);
  });

  it('should have GET /:childId/defaults', () => {
    expect(findRoute('get', '/:childId/defaults')).toBe(controller.defaults);
  });

  it('should have GET /:childId/:id', () => {
    expect(findRoute('get', '/:childId/:id')).toBe(controller.getOne);
  });

  it('should have PUT /:childId/:id', () => {
    expect(findRoute('put', '/:childId/:id')).toBe(controller.update);
  });

  it('should have DELETE /:childId/:id', () => {
    expect(findRoute('delete', '/:childId/:id')).toBe(controller.remove);
  });

  it('should register /lookups/options and /:childId/defaults before /:childId/:id', () => {
    const paths = router.stack.filter((layer) => layer.route).map((layer) => layer.route?.path);

    expect(paths.indexOf('/lookups/options')).toBeLessThan(paths.indexOf('/:childId/:id'));
    expect(paths.indexOf('/:childId/defaults')).toBeLessThan(paths.indexOf('/:childId/:id'));
  });

  it('should only have seven routes', () => {
    const routes = router.stack.filter((layer) => layer.route);

    expect(routes).toHaveLength(7);
  });
});
