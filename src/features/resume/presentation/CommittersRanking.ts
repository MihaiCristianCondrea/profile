import { fetchCommittersData } from '../data/CommittersDataSource.ts';
import {
  findCommitterRanking,
  formatOrdinal,
} from '../domain/CommittersRanking.ts';

const COMMITTERS_USERNAME = 'MihaiCristianCondrea';
const UPDATED_FALLBACK = 'Last updated: —';

export function updateCommittersStatus(
  statusElement: HTMLElement | null,
  message: string,
  isError = false,
): void {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
}

export async function fetchCommittersRanking(): Promise<void> {
  const rankElement = document.getElementById('committers-rank');
  const statusElement = document.getElementById('committers-status');
  const updatedElement = document.getElementById('committers-updated');
  if (!rankElement || !statusElement) return;

  rankElement.textContent = '—';
  updateCommittersStatus(statusElement, 'Checking latest ranking…');
  if (updatedElement) updatedElement.textContent = UPDATED_FALLBACK;

  try {
    const ranking = findCommitterRanking(
      await fetchCommittersData(),
      COMMITTERS_USERNAME,
    );
    if (!ranking) {
      updateCommittersStatus(
        statusElement,
        'Mihai-Cristian Condrea is not listed in the current ranking.',
        true,
      );
      return;
    }

    rankElement.textContent = `#${ranking.rank.toLocaleString()}`;
    updateCommittersStatus(
      statusElement,
      `Mihai-Cristian Condrea is currently ${formatOrdinal(ranking.rank)} in Romania's GitHub committers leaderboard.`,
    );
    if (updatedElement) {
      updatedElement.textContent = ranking.dataAsOf
        ? `Last updated: ${ranking.dataAsOf}`
        : UPDATED_FALLBACK;
    }
  } catch (error) {
    console.error('Committers ranking: Failed to load data.', error);
    updateCommittersStatus(
      statusElement,
      'Ranking data is unavailable right now. Please try again later.',
      true,
    );
  }
}
