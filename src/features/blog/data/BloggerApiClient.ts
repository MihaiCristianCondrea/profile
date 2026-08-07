import type { BlogPost } from '../domain/BlogPost.ts';

export interface BlogConfiguration {
  dataUrl: string;
}

export const appConfig: { blog: BlogConfiguration } = {
  blog: {
    dataUrl: 'blog-posts.json',
  },
};

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function extractFirstImageFromHtml(htmlContent: string): string | null {
  if (!htmlContent) return null;

  const imageSources = Array.from(
    htmlContent.matchAll(/<img[^>]+src=["']([^"']+)["']/gi),
    (match) => match[1],
  );
  return imageSources.find((source) => !source.startsWith('data:image'))
    ?? htmlContent.match(/https?:\/\/[^"']+\.googleusercontent\.com\/[^"']+/i)?.[0]
    ?? null;
}

function readFirstImage(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  for (const image of value) {
    if (!image || typeof image !== 'object') continue;
    const url = readString((image as Record<string, unknown>).url);
    if (url) return url;
  }
  return undefined;
}

function normalizePost(value: unknown): BlogPost | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const content = readString(source.content);
  return {
    title: readString(source.title),
    content,
    url: readString(source.url),
    imageUrl: readFirstImage(source.images)
      ?? extractFirstImageFromHtml(content ?? '')
      ?? undefined,
  };
}

export async function fetchBloggerPostsData(
  config: BlogConfiguration = appConfig.blog,
): Promise<BlogPost[]> {
  const response = await fetch(config.dataUrl, {
    headers: { Accept: 'application/json' },
    cache: 'no-cache',
  });
  if (!response.ok) {
    throw new Error(`Unable to load generated blog posts (${response.status}).`);
  }

  const payload = await response.json() as unknown;
  if (!payload || typeof payload !== 'object') return [];
  const items = (payload as Record<string, unknown>).items;
  if (!Array.isArray(items)) return [];
  return items.map(normalizePost).filter((post): post is BlogPost => post !== null);
}
