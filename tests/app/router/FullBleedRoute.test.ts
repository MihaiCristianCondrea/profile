import { getRoute, getRoutes } from '../../../src/app/router/RouteRegistry';

describe('full-bleed routes', () => {
  test('the Smart Cleaner presentation opts out of the content column', () => {
    expect(getRoute('smart-cleaner-for-android')?.fullBleed).toBe(true);
  });

  test('it is the only full-bleed route', () => {
    const fullBleed = getRoutes().filter((route) => route.fullBleed).map((route) => route.id);

    expect(fullBleed).toEqual(['smart-cleaner-for-android']);
  });

  test('ordinary routes stay inside the content column', () => {
    expect(getRoute('home')?.fullBleed).toBe(false);
    expect(getRoute('projects')?.fullBleed).toBe(false);
    expect(getRoute('resume')?.fullBleed).toBe(false);
  });
});
