import {
  findCommitterRanking,
  formatDataAsOf,
  formatOrdinal,
} from '../../../../src/features/resume/domain/CommittersRanking';

describe('CommittersRanking domain rules', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('formats ordinal values', () => {
    expect(formatOrdinal(1)).toBe('1st');
    expect(formatOrdinal(12)).toBe('12th');
    expect(formatOrdinal(-23)).toBe('-23rd');
    expect(formatOrdinal('unknown')).toBe('unknown');
  });

  test('finds a user rank and formats its timestamp', () => {
    jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('20 Feb 2024');

    expect(findCommitterRanking({
      usernames: ['Another User', 'MihaiCristianCondrea'],
      dataAsOf: '2024-02-20 12:34:56 +0300',
    }, 'MihaiCristianCondrea')).toEqual({
      rank: 2,
      dataAsOf: '20 Feb 2024',
    });
    expect(formatDataAsOf('not a date')).toBe('not a date');
    expect(findCommitterRanking({ usernames: [] }, 'MihaiCristianCondrea')).toBeNull();
  });
});
