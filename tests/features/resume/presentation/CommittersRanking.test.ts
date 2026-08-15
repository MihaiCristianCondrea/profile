import { fetchCommittersRanking } from '../../../../src/features/resume/presentation/CommittersRanking';

describe('CommittersRanking presentation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="committers-ranking">
        <div id="committers-rank"></div>
        <div id="committers-status"></div>
        <div id="committers-updated"></div>
      </div>
    `;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders a successful ranking response', async () => {
    jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('20 Feb 2024');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        user: ['Another User', 'MihaiCristianCondrea'],
        data_asof: '2024-02-20 12:34:56 +0300',
      }),
    });

    await fetchCommittersRanking();

    expect(document.getElementById('committers-rank')?.textContent).toBe('#2');
    expect(document.getElementById('committers-status')?.textContent)
      .toContain('currently 2nd');
    expect(document.getElementById('committers-updated')?.textContent)
      .toBe('Last updated: 20 Feb 2024');
    expect(document.getElementById('committers-ranking')?.hidden).toBe(false);
  });

  test('keeps the ranking hidden when loading fails', async () => {
    const error = new Error('offline');
    (global.fetch as jest.Mock).mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await fetchCommittersRanking();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Committers ranking: Failed to load data.',
      error,
    );
    const status = document.getElementById('committers-status');
    expect(status?.textContent).toBe(
      'Ranking data is unavailable right now. Please try again later.',
    );
    expect(status?.classList.contains('error')).toBe(true);
    expect(document.getElementById('committers-ranking')?.hidden).toBe(true);
  });

  test('keeps the ranking hidden when the user is not in the data', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        user: ['Another User'],
        data_asof: '2024-02-20 12:34:56 +0300',
      }),
    });

    await fetchCommittersRanking();

    expect(document.getElementById('committers-ranking')?.hidden).toBe(true);
  });
});
