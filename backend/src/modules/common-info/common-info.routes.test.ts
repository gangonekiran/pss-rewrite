import { describe, expect, it, vi } from 'vitest';

import router from './common-info.routes.js';
import * as controller from './common-info.controller.js';

vi.mock('./common-info.controller.js', () => ({
  regions: vi.fn(),
  towns: vi.fn(),
}));

function findRoute(path: string) {
  return router.stack.find((layer) => layer.route?.path === path)?.route;
}

describe('Common Info Routes', () => {
  it('should have GET /regions', () => {
    const route = findRoute('/regions');

    expect(route).toBeDefined();
    expect(route?.stack[0].method).toBe('get');
    expect(route?.stack[0].handle).toBe(controller.regions);
  });

  it('should have GET /towns', () => {
    const route = findRoute('/towns');

    expect(route).toBeDefined();
    expect(route?.stack[0].method).toBe('get');
    expect(route?.stack[0].handle).toBe(controller.towns);
  });

  it('should only have two routes', () => {
    const routes = router.stack.filter((layer) => layer.route);

    expect(routes).toHaveLength(2);
  });
});
