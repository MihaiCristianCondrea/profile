import type { RouteConfig } from '../../../src/core/types';
import {
  buildCanonicalUrl,
  updateMetadataForRoute,
} from '../../../src/core/metadata/MetadataManager';

const route: RouteConfig = {
  id: 'projects',
  title: 'Projects',
  path: null,
  onLoad: null,
  metadata: {
    description: 'A detailed project showcase.',
    keywords: ['Android', 'TypeScript'],
    canonicalSlug: 'projects',
    openGraph: {
      title: 'Projects | Showcase',
      description: 'A detailed project showcase.',
      type: 'article',
      image: 'https://example.com/project.png',
      imageAlt: 'Project preview',
      siteName: 'Mihai Profile',
    },
    twitter: {
      card: 'summary',
      title: 'Projects on Display',
      description: 'A detailed project showcase.',
      image: 'https://example.com/project.png',
      site: '@MihaiCrstian',
      creator: '@MihaiCrstian',
    },
  },
};

describe('route metadata', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  test('builds canonical hash URLs consistently', () => {
    expect(buildCanonicalUrl('')).toBe(
      'https://mihaicristiancondrea.github.io/profile/',
    );
    expect(buildCanonicalUrl('#projects')).toBe(
      'https://mihaicristiancondrea.github.io/profile/#projects',
    );
  });

  test('updates metadata using a typed route configuration', () => {
    const result = updateMetadataForRoute(route, {
      pageId: 'projects',
      pageTitle: 'Projects',
      loadStatus: 'success',
    });

    expect(result?.canonicalUrl).toBe(
      'https://mihaicristiancondrea.github.io/profile/#projects',
    );
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content'))
      .toBe('A detailed project showcase.');
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content'))
      .toBe('Projects | Showcase');
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'))
      .toBe('Projects on Display');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe('https://mihaicristiancondrea.github.io/profile/#projects');
  });

  test('uses safe defaults when a route is unavailable', () => {
    const result = updateMetadataForRoute(null, {
      pageId: 'missing',
      pageTitle: 'Not Found',
      loadStatus: 'not-found',
    });

    expect(result?.description).toContain('Mihai-Cristian Condrea');
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content'))
      .toBe('Not Found');
  });
});
