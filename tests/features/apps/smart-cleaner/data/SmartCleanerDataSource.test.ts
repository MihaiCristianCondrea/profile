import { fetchSmartCleanerShortDescription } from '../../../../../src/features/apps/smart-cleaner/data/SmartCleanerDataSource';

describe('fetchSmartCleanerShortDescription', () => {
  const originalFetch = globalThis.fetch;

  const mockFetch = (value: unknown, ok = true): void => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok,
      json: async () => value,
    }) as unknown as typeof fetch;
  };

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('returns the trimmed short description', async () => {
    mockFetch({ data: { app: { short_description: '  One-tap cleaner.  ' } } });

    await expect(fetchSmartCleanerShortDescription()).resolves.toBe('One-tap cleaner.');
  });

  test('returns null when the response is not ok', async () => {
    mockFetch({ data: { app: { short_description: 'ignored' } } }, false);

    await expect(fetchSmartCleanerShortDescription()).resolves.toBeNull();
  });

  test('returns null for a payload without a usable description', async () => {
    mockFetch({ data: { app: { short_description: '   ' } } });
    await expect(fetchSmartCleanerShortDescription()).resolves.toBeNull();

    mockFetch({ data: {} });
    await expect(fetchSmartCleanerShortDescription()).resolves.toBeNull();

    mockFetch(null);
    await expect(fetchSmartCleanerShortDescription()).resolves.toBeNull();

    mockFetch({ data: { app: { short_description: 42 } } });
    await expect(fetchSmartCleanerShortDescription()).resolves.toBeNull();
  });

  test('returns null instead of rejecting when the network fails', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    await expect(fetchSmartCleanerShortDescription()).resolves.toBeNull();
  });
});
