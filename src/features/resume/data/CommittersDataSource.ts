import type { CommittersSnapshot } from '../domain/CommittersRanking.ts';

export const COMMITTERS_RANKING_URL =
  'https://committers.top/rank_only/romania.json';

export async function fetchCommittersData(): Promise<CommittersSnapshot> {
  const response = await fetch(COMMITTERS_RANKING_URL, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Committers request failed with status ${response.status}.`);
  }

  const payload = await response.json() as unknown;
  if (!payload || typeof payload !== 'object') {
    throw new Error('Committers response must be an object.');
  }

  const source = payload as Record<string, unknown>;
  return {
    usernames: Array.isArray(source.user)
      ? source.user.filter((value): value is string => typeof value === 'string')
      : [],
    dataAsOf: typeof source.data_asof === 'string'
      ? source.data_asof
      : undefined,
  };
}
