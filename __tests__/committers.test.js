import { jest } from '@jest/globals';
import {
  COMMITTERS_RANKING_URL,
  COMMITTERS_UPDATED_FALLBACK,
  formatOrdinal,
  formatDataAsOf,
  updateCommittersStatus,
  fetchCommittersRanking
} from '../assets/js/services/committers.js';

describe('services/committers', () => {
  describe('formatOrdinal', () => {
    test('formats positive ordinal numbers correctly', () => {
      expect(formatOrdinal(1)).toBe('1st');
      expect(formatOrdinal(2)).toBe('2nd');
      expect(formatOrdinal(3)).toBe('3rd');
      expect(formatOrdinal(4)).toBe('4th');
    });

    test('handles teen suffix rules', () => {
      expect(formatOrdinal(11)).toBe('11th');
      expect(formatOrdinal(12)).toBe('12th');
      expect(formatOrdinal(13)).toBe('13th');
    });

    test('supports negative and non-numeric values', () => {
      expect(formatOrdinal(-21)).toBe('-21st');
      expect(formatOrdinal(Number.NaN)).toBe('NaN');
      expect(formatOrdinal('not-a-number')).toBe('not-a-number');
    });
  });

  describe('formatDataAsOf', () => {
    test('parses committers timestamps into locale strings', () => {
      const toLocaleSpy = jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('Formatted Timestamp');
      const result = formatDataAsOf('2024-02-20 12:34:56 +0300');
      expect(toLocaleSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe('Formatted Timestamp');
      toLocaleSpy.mockRestore();
    });

    test('falls back to native Date parsing', () => {
      const toLocaleSpy = jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('Fallback Parsed Date');
      const result = formatDataAsOf('Tue, 01 Jan 2025 12:00:00 GMT');
      expect(toLocaleSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe('Fallback Parsed Date');
      toLocaleSpy.mockRestore();
    });

    test('returns trimmed string when parsing fails', () => {
      expect(formatDataAsOf('  not a date  ')).toBe('not a date');
    });

    test('returns null for empty or non-string values', () => {
      expect(formatDataAsOf('   ')).toBeNull();
      expect(formatDataAsOf(null)).toBeNull();
      expect(formatDataAsOf(42)).toBeNull();
    });
  });

  describe('updateCommittersStatus', () => {
    test('updates status text and toggles error class', () => {
      const element = document.createElement('div');
      updateCommittersStatus(element, 'Ready', false);
      expect(element.textContent).toBe('Ready');
      expect(element.classList.contains('error')).toBe(false);

      updateCommittersStatus(element, 'Error message', true);
      expect(element.textContent).toBe('Error message');
      expect(element.classList.contains('error')).toBe(true);
    });

    test('is a no-op when status element is missing', () => {
      expect(() => updateCommittersStatus(null, 'Anything', true)).not.toThrow();
    });
  });

  describe('fetchCommittersRanking', () => {
    let originalFetch;

    beforeEach(() => {
      document.body.innerHTML = `
        <div id="committers-rank"></div>
        <div id="committers-status" class="status"></div>
        <div id="committers-updated"></div>
      `;
      originalFetch = global.fetch;
      global.fetch = jest.fn();
    });

    afterEach(() => {
      if (originalFetch === undefined) {
        delete global.fetch;
      } else {
        global.fetch = originalFetch;
      }
      document.body.innerHTML = '';
      jest.restoreAllMocks();
    });

    test('updates DOM on successful fetch', async () => {
      jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('Formatted Timestamp');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          user: ['Someone Else', 'MihaiCristianCondrea', 'Another Person'],
          data_asof: '2024-02-20 12:34:56 +0300'
        })
      });

      await fetchCommittersRanking();

      expect(global.fetch).toHaveBeenCalledWith(COMMITTERS_RANKING_URL, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });

      expect(document.getElementById('committers-rank').textContent).toBe('#2');
      const statusElement = document.getElementById('committers-status');
      expect(statusElement.textContent).toBe("Mihai-Cristian Condrea is currently 2nd in Romania's GitHub committers leaderboard.");
      expect(statusElement.classList.contains('error')).toBe(false);
      expect(document.getElementById('committers-updated').textContent).toBe('Last updated: Formatted Timestamp');
    });

    test('shows missing user message when profile is absent', async () => {
      const toLocaleSpy = jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('Should not be used');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          user: ['Someone Else'],
          data_asof: '2024-02-20 12:34:56 +0300'
        })
      });

      await fetchCommittersRanking();

      expect(document.getElementById('committers-rank').textContent).toBe('—');
      const statusElement = document.getElementById('committers-status');
      expect(statusElement.textContent).toBe('Mihai-Cristian Condrea is not listed in the current ranking.');
      expect(statusElement.classList.contains('error')).toBe(true);
      expect(document.getElementById('committers-updated').textContent).toBe(COMMITTERS_UPDATED_FALLBACK);
      expect(toLocaleSpy).not.toHaveBeenCalled();
    });

    test('logs and displays error state when fetch fails', async () => {
      const error = new Error('Network down');
      global.fetch.mockRejectedValueOnce(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await fetchCommittersRanking();

      const statusElement = document.getElementById('committers-status');
      expect(statusElement.textContent).toBe('Ranking data is unavailable right now. Please try again later.');
      expect(statusElement.classList.contains('error')).toBe(true);
      expect(document.getElementById('committers-updated').textContent).toBe(COMMITTERS_UPDATED_FALLBACK);
      expect(document.getElementById('committers-rank').textContent).toBe('—');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Committers ranking error:', error);
      consoleErrorSpy.mockRestore();
    });
  });
});
