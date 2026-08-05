export interface CommittersSnapshot {
  usernames: string[];
  dataAsOf?: string;
}

export interface CommitterRanking {
  rank: number;
  dataAsOf: string | null;
}

export function formatOrdinal(value: number | string): string {
  const numericValue = Math.abs(Number(value));
  if (!Number.isFinite(numericValue)) return String(value);
  const mod100 = numericValue % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;

  switch (numericValue % 10) {
    case 1: return `${value}st`;
    case 2: return `${value}nd`;
    case 3: return `${value}rd`;
    default: return `${value}th`;
  }
}

export function formatDataAsOf(rawValue: unknown): string | null {
  if (typeof rawValue !== 'string' || !rawValue.trim()) return null;
  const normalized = rawValue.trim().replace(
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+([+-]\d{2})(\d{2})$/,
    '$1T$2$3:$4',
  );
  const date = new Date(normalized);
  return Number.isNaN(date.getTime())
    ? rawValue.trim()
    : date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
}

export function findCommitterRanking(
  data: CommittersSnapshot,
  username: string,
): CommitterRanking | null {
  const index = data.usernames.indexOf(username);
  return index < 0
    ? null
    : { rank: index + 1, dataAsOf: formatDataAsOf(data.dataAsOf) };
}
