import type {
  RouteConfig,
  RouteLoadContext,
  SanitizedMetadata,
} from '../types/index.ts';
import {
  DEFAULT_OPEN_GRAPH_TYPE,
  DEFAULT_TWITTER_CARD,
  SITE_DESCRIPTION,
  SITE_IMAGE,
  SITE_IMAGE_ALT,
  SITE_KEYWORDS,
  SITE_TITLE,
  SITE_TWITTER_HANDLE,
  buildCanonicalUrl,
} from './SiteMetadata.ts';

export { buildCanonicalUrl };

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

export function updateMetadataForRoute(
  routeConfig: RouteConfig | null,
  context: RouteLoadContext,
): SanitizedMetadata | null {
  if (!document.head) return null;

  const metadata = routeConfig?.metadata;
  const title = context.pageTitle || routeConfig?.title || SITE_TITLE;
  const description = metadata?.description || SITE_DESCRIPTION;
  const keywords = metadata?.keywords?.length
    ? metadata.keywords.join(', ')
    : SITE_KEYWORDS.join(', ');
  const canonicalUrl = buildCanonicalUrl(
    metadata?.canonicalSlug ?? (context.pageId === 'home' ? '' : context.pageId),
  );

  const openGraph = metadata?.openGraph;
  const ogTitle = openGraph?.title || title;
  const ogImage = openGraph?.image || SITE_IMAGE;

  updateMeta('name', 'description', description);
  updateMeta('name', 'keywords', keywords);
  updateMeta('property', 'og:title', ogTitle);
  updateMeta('property', 'og:description', openGraph?.description || description);
  updateMeta('property', 'og:type', openGraph?.type || DEFAULT_OPEN_GRAPH_TYPE);
  updateMeta('property', 'og:url', canonicalUrl);
  updateMeta('property', 'og:image', ogImage);
  updateMeta('property', 'og:image:alt', openGraph?.imageAlt || SITE_IMAGE_ALT);
  updateMeta('property', 'og:site_name', openGraph?.siteName || SITE_TITLE);

  const twitter = metadata?.twitter;
  const twitterTitle = twitter?.title || ogTitle;
  updateMeta('name', 'twitter:card', twitter?.card || DEFAULT_TWITTER_CARD);
  updateMeta('name', 'twitter:title', twitterTitle);
  updateMeta('name', 'twitter:description', twitter?.description || description);
  updateMeta('name', 'twitter:image', twitter?.image || ogImage);
  updateMeta('name', 'twitter:site', twitter?.site || SITE_TWITTER_HANDLE);
  updateMeta('name', 'twitter:creator', twitter?.creator || SITE_TWITTER_HANDLE);
  ensureCanonicalLink().href = canonicalUrl;

  return { canonicalUrl, description, keywords, ogTitle, twitterTitle };
}
