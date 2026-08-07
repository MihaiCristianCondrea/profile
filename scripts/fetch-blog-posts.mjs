import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG_URL = 'https://d4rk7355608.blogspot.com/';
const BLOGGER_API_REFERER = 'https://mihaicristiancondrea.github.io/profile/';
const MAX_RESULTS = 4;
const OUTPUT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../public/blog-posts.json',
);

function readString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function getErrorMessage(response) {
  const errorData = await response.json().catch(() => ({}));
  const error = errorData?.error;
  return error && typeof error === 'object' ? readString(error.message) : undefined;
}

async function fetchJson(url, description) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Referer: BLOGGER_API_REFERER,
    },
  });
  if (!response.ok) {
    const detail = await getErrorMessage(response);
    throw new Error(detail || `${description} (${response.status}).`);
  }
  return response.json();
}

const apiKey = process.env.BLOGGER_API_KEY?.trim();
if (!apiKey) {
  throw new Error('BLOGGER_API_KEY is required to generate blog posts.');
}

const blogInfoUrl = new URL('https://www.googleapis.com/blogger/v3/blogs/byurl');
blogInfoUrl.searchParams.set('url', BLOG_URL);
blogInfoUrl.searchParams.set('key', apiKey);

const blogInfo = await fetchJson(blogInfoUrl, 'Unable to load blog information');
if (!blogInfo?.id) {
  throw new Error('The Blogger API response did not include a blog identifier.');
}

const postsUrl = new URL(`https://www.googleapis.com/blogger/v3/blogs/${blogInfo.id}/posts`);
postsUrl.searchParams.set('key', apiKey);
postsUrl.searchParams.set('maxResults', String(MAX_RESULTS));
postsUrl.searchParams.set('fetchImages', 'true');
postsUrl.searchParams.set('fetchBodies', 'true');
postsUrl.searchParams.set('status', 'live');

const postsPayload = await fetchJson(postsUrl, 'Unable to load blog posts');
const items = Array.isArray(postsPayload?.items) ? postsPayload.items : [];
const publicPosts = items.map((post) => ({
  title: post?.title,
  content: post?.content,
  url: post?.url,
  images: post?.images,
}));

await mkdir(dirname(OUTPUT_PATH), { recursive: true });
await writeFile(
  OUTPUT_PATH,
  `${JSON.stringify({ items: publicPosts }, null, 2)}\n`,
  'utf8',
);

console.log(`Generated ${publicPosts.length} live Blogger post(s).`);
