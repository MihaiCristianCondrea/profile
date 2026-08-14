import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The blog is one optional section of the home page. If the feed cannot be
// retrieved the site still deploys: an empty feed is written, the front end
// hides the news section, and a warning is raised so the cause stays visible
// in the workflow summary instead of failing the whole Pages deploy.

const DEFAULT_BLOG_URL = 'https://d4rk7355608.blogspot.com/';
const BLOGGER_API_REFERER = 'https://mihaicristiancondrea.github.io/';
const MAX_RESULTS = 4;
const OUTPUT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../public/blog-posts.json',
);

const blogUrl = process.env.BLOGGER_BLOG_URL?.trim() || DEFAULT_BLOG_URL;
// Set BLOGGER_BLOG_ID to skip the byurl lookup entirely, which is useful when
// the blog's public address changes but the blog itself is unchanged.
const blogId = process.env.BLOGGER_BLOG_ID?.trim();
const apiKey = process.env.BLOGGER_API_KEY?.trim();

/** A feed that could not be retrieved. Anything else is a real defect. */
class BlogFeedError extends Error {}

function readString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function getErrorMessage(response) {
  const errorData = await response.json().catch(() => ({}));
  const error = errorData?.error;
  return error && typeof error === 'object' ? readString(error.message) : undefined;
}

async function fetchJson(url, description) {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Referer: BLOGGER_API_REFERER,
      },
    });
  } catch (cause) {
    throw new BlogFeedError(`${description}: request failed (${cause.message}).`);
  }

  if (!response.ok) {
    const detail = await getErrorMessage(response);
    // Keep the status alongside Google's message. The status is what
    // distinguishes a missing blog (404) from a blocked key (403).
    throw new BlogFeedError(
      `${description}: HTTP ${response.status}${detail ? ` — ${detail}` : '.'}`,
    );
  }
  return response.json();
}

async function resolveBlogId() {
  if (blogId) return blogId;

  const blogInfoUrl = new URL('https://www.googleapis.com/blogger/v3/blogs/byurl');
  blogInfoUrl.searchParams.set('url', blogUrl);
  blogInfoUrl.searchParams.set('key', apiKey);

  const blogInfo = await fetchJson(blogInfoUrl, `Blog lookup for ${blogUrl} failed`);
  if (!blogInfo?.id) {
    throw new BlogFeedError('The Blogger API response did not include a blog identifier.');
  }
  return blogInfo.id;
}

async function loadPosts() {
  if (!apiKey) {
    throw new BlogFeedError('BLOGGER_API_KEY is not set.');
  }

  const id = await resolveBlogId();
  const postsUrl = new URL(`https://www.googleapis.com/blogger/v3/blogs/${id}/posts`);
  postsUrl.searchParams.set('key', apiKey);
  postsUrl.searchParams.set('maxResults', String(MAX_RESULTS));
  postsUrl.searchParams.set('fetchImages', 'true');
  postsUrl.searchParams.set('fetchBodies', 'true');
  postsUrl.searchParams.set('status', 'live');

  const postsPayload = await fetchJson(postsUrl, `Post list for blog ${id} failed`);
  const items = Array.isArray(postsPayload?.items) ? postsPayload.items : [];
  return items.map((post) => ({
    title: post?.title,
    content: post?.content,
    url: post?.url,
    images: post?.images,
  }));
}

async function writeFeed(posts) {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(
    OUTPUT_PATH,
    `${JSON.stringify({ items: posts }, null, 2)}\n`,
    'utf8',
  );
}

try {
  const posts = await loadPosts();
  await writeFeed(posts);
  console.log(`Generated ${posts.length} live Blogger post(s).`);
} catch (error) {
  if (!(error instanceof BlogFeedError)) throw error;

  await writeFeed([]);
  // GitHub Actions renders this as a warning annotation on the run.
  console.log(`::warning title=Blogger feed unavailable::${error.message}`);
  console.warn(
    `Blogger feed unavailable: ${error.message}\n`
    + 'The site will deploy without the news section. Check that the blog is '
    + 'public and reachable at the configured URL, that BLOGGER_API_KEY is '
    + 'valid with the Blogger API enabled, and that any HTTP referrer '
    + `restriction allows ${BLOGGER_API_REFERER}. Set BLOGGER_BLOG_ID to skip `
    + 'the URL lookup.',
  );
}
