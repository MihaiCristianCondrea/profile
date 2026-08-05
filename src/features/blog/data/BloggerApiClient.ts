import type { BlogPost } from '../domain/BlogPost.ts';

export interface BlogConfiguration {
  url: string;
  maxResults: number;
  getApiKey: () => string;
}

export const appConfig: { blog: BlogConfiguration } = {
  blog: {
    url: 'https://d4rk7355608.blogspot.com/',
    maxResults: 4,
    getApiKey: () => window.atob('QUl6YVN5QXVqb0dXcUhIR1ZuYjh6eXZDUEdLWnJkajc5TFRCUFQw'),
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

async function getErrorMessage(response: Response): Promise<string | undefined> {
  const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
  const error = errorData.error;
  return error && typeof error === 'object'
    ? readString((error as Record<string, unknown>).message)
    : undefined;
}

export async function fetchBloggerPostsData(
  config: BlogConfiguration = appConfig.blog,
): Promise<BlogPost[]> {
  const apiKey = config.getApiKey();
  if (!apiKey) throw new Error('Blog configuration is unavailable.');

  const blogInfoUrl = new URL('https://www.googleapis.com/blogger/v3/blogs/byurl');
  blogInfoUrl.searchParams.set('url', config.url);
  blogInfoUrl.searchParams.set('key', apiKey);

  const blogInfoResponse = await fetch(blogInfoUrl);
  if (!blogInfoResponse.ok) {
    const detail = await getErrorMessage(blogInfoResponse);
    throw new Error(detail || `Unable to load blog information (${blogInfoResponse.status}).`);
  }

  const blogInfo = await blogInfoResponse.json() as { id?: string };
  if (!blogInfo.id) throw new Error('The blog identifier is missing.');

  const postsUrl = new URL(`https://www.googleapis.com/blogger/v3/blogs/${blogInfo.id}/posts`);
  postsUrl.searchParams.set('key', apiKey);
  postsUrl.searchParams.set('maxResults', String(config.maxResults));
  postsUrl.searchParams.set('fetchImages', 'true');
  postsUrl.searchParams.set('fetchBodies', 'true');

  const postsResponse = await fetch(postsUrl);
  if (!postsResponse.ok) {
    const detail = await getErrorMessage(postsResponse);
    throw new Error(detail || `Unable to load blog posts (${postsResponse.status}).`);
  }

  const payload = await postsResponse.json() as unknown;
  if (!payload || typeof payload !== 'object') return [];
  const items = (payload as Record<string, unknown>).items;
  if (!Array.isArray(items)) return [];
  return items.map(normalizePost).filter((post): post is BlogPost => post !== null);
}
