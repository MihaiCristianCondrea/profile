// Single source of truth for site-wide identity and social defaults.
// Route definitions and the runtime metadata writer both read from here so a
// change to the site title or share image only has to happen once.

export const SITE_BASE_URL = 'https://mihaicristiancondrea.github.io/profile/';
export const SITE_TITLE = "Mihai's Profile";
export const SITE_DESCRIPTION = "Explore Mihai-Cristian Condrea's Android developer portfolio featuring Jetpack Compose apps, Material Design systems, and open-source tools.";
export const SITE_KEYWORDS: readonly string[] = [
  'Mihai Cristian Condrea',
  'Android developer portfolio',
  'Jetpack Compose',
  'Kotlin apps',
  'Material Design UI',
];
export const SITE_IMAGE = `${SITE_BASE_URL}images/profile/cv_profile_pic.png`;
export const SITE_IMAGE_ALT = 'Portrait of Android developer Mihai-Cristian Condrea';
export const SITE_TWITTER_HANDLE = '@MihaiCrstian';
export const DEFAULT_OPEN_GRAPH_TYPE = 'website';
export const DEFAULT_TWITTER_CARD = 'summary_large_image';

/**
 * Turns a route slug into an absolute canonical URL. Absolute inputs are kept
 * as-is so a route can point at an external canonical target.
 */
export function buildCanonicalUrl(slug: string | null | undefined): string {
  const trimmed = slug?.trim() ?? '';
  if (!trimmed || trimmed === '/' || trimmed === '#') return SITE_BASE_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const normalized = trimmed.replace(/^[/#]+/, '').replace(/[/#]+$/, '');
  return normalized ? `${SITE_BASE_URL}#${normalized}` : SITE_BASE_URL;
}
