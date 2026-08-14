import { fetchSmartCleanerMetadata } from '../../../../../src/features/apps/smart-cleaner/data/SmartCleanerDataSource';

describe('fetchSmartCleanerMetadata', () => {
  const originalFetch = globalThis.fetch;

  const mockFetch = (value: unknown, ok = true): void => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok,
      json: async () => value,
    }) as unknown as typeof fetch;
  };

  const withApp = (app: unknown): unknown => ({ data: { app } });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('returns the trimmed short description', async () => {
    mockFetch(withApp({ short_description: '  One-tap cleaner.  ' }));

    await expect(fetchSmartCleanerMetadata()).resolves.toEqual({
      shortDescription: 'One-tap cleaner.',
      iconUrl: null,
    });
  });

  test('accepts either casing for the description key', async () => {
    mockFetch(withApp({ shortDescription: 'Camel case.' }));

    await expect(fetchSmartCleanerMetadata()).resolves.toMatchObject({
      shortDescription: 'Camel case.',
    });
  });

  // The metadata service has shipped both spellings for the icon, so each
  // accepted key must resolve.
  test.each([
    'iconUrl',
    'icon_url',
    'iconLogo',
    'icon_logo',
    'icon',
    'image',
    'imageUrl',
    'image_url',
  ])('reads the app icon from %s', async (key) => {
    mockFetch(withApp({ [key]: 'https://example.com/icon.png' }));

    await expect(fetchSmartCleanerMetadata()).resolves.toMatchObject({
      iconUrl: 'https://example.com/icon.png',
    });
  });

  test('prefers the documented key order when several are present', async () => {
    mockFetch(withApp({
      image: 'https://example.com/last.png',
      iconLogo: 'https://example.com/middle.png',
      iconUrl: 'https://example.com/first.png',
    }));

    await expect(fetchSmartCleanerMetadata()).resolves.toMatchObject({
      iconUrl: 'https://example.com/first.png',
    });
  });

  test('rejects an icon that is not an http URL', async () => {
    mockFetch(withApp({ iconUrl: 'javascript:alert(1)' }));

    await expect(fetchSmartCleanerMetadata()).resolves.toMatchObject({ iconUrl: null });
  });

  test('falls back to a later key when an earlier one is unusable', async () => {
    mockFetch(withApp({
      iconUrl: 'javascript:alert(1)',
      iconLogo: 'https://example.com/safe.png',
    }));

    await expect(fetchSmartCleanerMetadata()).resolves.toMatchObject({
      iconUrl: 'https://example.com/safe.png',
    });
  });

  test('returns empty metadata for unusable responses', async () => {
    const empty = { shortDescription: null, iconUrl: null };

    mockFetch(withApp({ short_description: '   ' }));
    await expect(fetchSmartCleanerMetadata()).resolves.toEqual(empty);

    mockFetch({ data: {} });
    await expect(fetchSmartCleanerMetadata()).resolves.toEqual(empty);

    mockFetch(null);
    await expect(fetchSmartCleanerMetadata()).resolves.toEqual(empty);

    mockFetch(withApp({ short_description: 42 }));
    await expect(fetchSmartCleanerMetadata()).resolves.toEqual(empty);

    mockFetch(withApp({ short_description: 'ignored' }), false);
    await expect(fetchSmartCleanerMetadata()).resolves.toEqual(empty);
  });

  test('returns empty metadata instead of rejecting when the network fails', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    await expect(fetchSmartCleanerMetadata()).resolves.toEqual({
      shortDescription: null,
      iconUrl: null,
    });
  });
});
