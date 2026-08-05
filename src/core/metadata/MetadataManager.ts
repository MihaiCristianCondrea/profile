import type {
  RouteConfig,
  RouteLoadContext,
  SanitizedMetadata,
} from '../types/index.ts';

const DEFAULT_TITLE = "Mihai's Profile";
const DEFAULT_DESCRIPTION = "Explore Mihai-Cristian Condrea's Android developer portfolio featuring Jetpack Compose apps, Material Design systems, and open-source tools.";
const DEFAULT_KEYWORDS = [
  'Mihai Cristian Condrea',
  'Android developer portfolio',
  'Jetpack Compose',
  'Kotlin apps',
  'Material Design UI',
];
const SITE_BASE_URL = 'https://mihaicristiancondrea.github.io/profile/';
const DEFAULT_IMAGE = `${SITE_BASE_URL}images/profile/cv_profile_pic.png`;
const DEFAULT_IMAGE_ALT = 'Portrait of Android developer Mihai-Cristian Condrea';
const DEFAULT_TWITTER_HANDLE = '@MihaiCrstian';

function ensureMeta(attribute: 'name' | 'property', value: string): HTMLMetaElement {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${value}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  return element;
}

function ensureCanonicalLink(): HTMLLinkElement {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  return element;
}

function updateMeta(attribute: 'name' | 'property', key: string, content: string): void {
  ensureMeta(attribute, key).content = content;
}

export function buildCanonicalUrl(slug: string | null | undefined): string {
  const trimmed = slug?.trim() ?? '';
  if (!trimmed || trimmed === '/' || trimmed === '#') return SITE_BASE_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const normalized = trimmed.replace(/^[/#]+/, '').replace(/[/#]+$/, '');
  return normalized ? `${SITE_BASE_URL}#${normalized}` : SITE_BASE_URL;
}

export function updateMetadataForRoute(
  routeConfig: RouteConfig | null,
  context: RouteLoadContext,
): SanitizedMetadata | null {
  if (!document.head) return null;

  const metadata = routeConfig?.metadata;
  const title = context.pageTitle || routeConfig?.title || DEFAULT_TITLE;
  const description = metadata?.description || DEFAULT_DESCRIPTION;
  const keywords = metadata?.keywords?.length
    ? metadata.keywords.join(', ')
    : DEFAULT_KEYWORDS.join(', ');
  const canonicalUrl = buildCanonicalUrl(
    metadata?.canonicalSlug ?? (context.pageId === 'home' ? '' : context.pageId),
  );

  const openGraph = metadata?.openGraph;
  const ogTitle = openGraph?.title || title;
  const ogDescription = openGraph?.description || description;
  const ogImage = openGraph?.image || DEFAULT_IMAGE;

  updateMeta('name', 'description', description);
  updateMeta('name', 'keywords', keywords);
  updateMeta('property', 'og:title', ogTitle);
  updateMeta('property', 'og:description', ogDescription);
  updateMeta('property', 'og:type', openGraph?.type || 'website');
  updateMeta('property', 'og:url', canonicalUrl);
  updateMeta('property', 'og:image', ogImage);
  updateMeta('property', 'og:image:alt', openGraph?.imageAlt || DEFAULT_IMAGE_ALT);
  updateMeta('property', 'og:site_name', openGraph?.siteName || DEFAULT_TITLE);

  const twitter = metadata?.twitter;
  const twitterTitle = twitter?.title || ogTitle;
  updateMeta('name', 'twitter:card', twitter?.card || 'summary_large_image');
  updateMeta('name', 'twitter:title', twitterTitle);
  updateMeta('name', 'twitter:description', twitter?.description || description);
  updateMeta('name', 'twitter:image', twitter?.image || ogImage);
  updateMeta('name', 'twitter:site', twitter?.site || DEFAULT_TWITTER_HANDLE);
  updateMeta('name', 'twitter:creator', twitter?.creator || DEFAULT_TWITTER_HANDLE);
  ensureCanonicalLink().href = canonicalUrl;

  return { canonicalUrl, description, keywords, ogTitle, twitterTitle };
}

export const SiteMetadata = {
  buildCanonicalUrl,
  updateForRoute: updateMetadataForRoute,
};
