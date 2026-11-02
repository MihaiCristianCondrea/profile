import { fetchPixelModel, PIXEL_MODEL_URL } from '../../../../../src/features/apps/smart-cleaner/data/PixelModelSource';

describe('fetchPixelModel', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('returns the binary glTF from the site', async () => {
    const buffer = new ArrayBuffer(4);
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(buffer) }) as typeof fetch;

    await expect(fetchPixelModel()).resolves.toBe(buffer);
    expect(globalThis.fetch).toHaveBeenCalledWith(PIXEL_MODEL_URL);
  });

  test('rejects when the model is missing, so the page keeps the flat device', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as typeof fetch;

    await expect(fetchPixelModel()).rejects.toThrow('404');
  });
});
