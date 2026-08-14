import type { PageMarkupResult } from '../../core/types/index.ts';
import { getRoute } from './RouteRegistry.ts';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] ?? character);
}

function createStatusHtml(message: string): string {
  return `<section class="page-section active" aria-live="polite"><p class="error-message">${escapeHtml(message)}</p></section>`;
}

export async function fetchPageMarkup(
  pageId: string,
  options: { initialHomeHTML?: string } = {},
): Promise<PageMarkupResult> {
  const routeConfig = getRoute(pageId);
  if (!routeConfig) {
    return {
      status: 'not-found',
      title: 'Not Found',
      html: createStatusHtml(`Page not found: ${pageId}`),
    };
  }

  if (!routeConfig.path) {
    return {
      status: 'success',
      title: routeConfig.title,
      html: routeConfig.id === 'home' ? options.initialHomeHTML ?? '' : '',
      sourceTitle: routeConfig.title,
    };
  }

  try {
    const response = await fetch(routeConfig.path);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}.`);
    }

    return {
      status: 'success',
      title: routeConfig.title,
      html: await response.text(),
      sourceTitle: routeConfig.title,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown request error.';
    return {
      status: 'error',
      title: 'Error',
      html: createStatusHtml(`Failed to load ${routeConfig.title}. ${detail}`),
      error,
      sourceTitle: routeConfig.title,
    };
  }
}
