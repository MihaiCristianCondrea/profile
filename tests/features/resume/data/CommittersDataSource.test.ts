import {
  COMMITTERS_RANKING_URL,
  fetchCommittersData,
} from '../../../../src/features/resume/data/CommittersDataSource';

describe('CommittersDataSource', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('normalizes the remote payload at the data boundary', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        user: ['MihaiCristianCondrea', 42, null],
        data_asof: '2024-02-20 12:34:56 +0300',
      }),
    });

    await expect(fetchCommittersData()).resolves.toEqual({
      usernames: ['MihaiCristianCondrea'],
      dataAsOf: '2024-02-20 12:34:56 +0300',
    });
    expect(global.fetch).toHaveBeenCalledWith(COMMITTERS_RANKING_URL, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  });

  test('rejects failed responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });

    await expect(fetchCommittersData()).rejects.toThrow(
      'Committers request failed with status 503.',
    );
  });
});
