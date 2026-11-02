import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getRoute } from '../../../../../src/app/router/RouteRegistry';

/**
 * The Smart Cleaner presentation is a landing page shared by direct link
 * (#smart-cleaner-for-android). It is deliberately absent from the drawer.
 */
describe('Smart Cleaner presentation reachability', () => {
  const indexHtml = readFileSync(join(__dirname, '../../../../../index.html'), 'utf8');

  test('the drawer has no entry for it', () => {
    expect(indexHtml).not.toMatch(/<mnw-navigation-item[^>]+href="#smart-cleaner-for-android"/);
  });

  test('the route still resolves by its link', () => {
    expect(getRoute('smart-cleaner-for-android')?.path)
      .toBe('content/features/apps/smart-cleaner/presentation/smart-cleaner-for-android.html');
  });
});
