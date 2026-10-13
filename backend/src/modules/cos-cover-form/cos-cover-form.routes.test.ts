import { describe, expect, it, vi } from 'vitest';

import router from './cos-cover-form.routes';
import * as controller from './cos-cover-form.controller';

vi.mock('./cos-cover-form.controller', () => ({
  get: vi.fn(),
  getOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

function findRoute(method: string, path: string) {
  const layer = router.stack.find(
    (item) => item.route?.path === path && item.route.stack[0].method === method,
  );

  return layer?.route?.stack[0].handle;
}

describe('COS Cover Form Routes', () => {
  it('should have GET /:childId', () => {
    expect(findRoute('get', '/:childId')).toBe(controller.get);
  });

  it('should have POST /:childId', () => {
    expect(findRoute('post', '/:childId')).toBe(controller.create);
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

  it('should only have five routes', () => {
    const routes = router.stack.filter((layer) => layer.route);

    expect(routes).toHaveLength(5);
  });
});
