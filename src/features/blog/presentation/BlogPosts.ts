import {
  getDynamicElement,
} from '../../../core/dom/DomUtils.ts';
import { fetchBloggerPostsData } from '../data/BloggerApiClient.ts';
import type { BlogPost } from '../domain/BlogPost.ts';

interface SharePostData {
  title: string;
  text: string;
  url: string;
}

const feedbackTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

function normalizeHttpUrl(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : fallback;
  } catch {
    return fallback;
  }
}

function createIcon(name: string): HTMLElement {
  const icon = document.createElement('md-icon');
  icon.slot = 'icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = name;
  return icon;
}

export function createBlogPostCard(post: BlogPost): HTMLElement {
  const card = document.createElement('md-filled-card');
  card.className = 'news-card';

  const placeholderImageUrl = 'images/placeholder.png';
  const rawImageUrl = post.imageUrl ?? placeholderImageUrl;
  const imageUrl = normalizeHttpUrl(rawImageUrl, placeholderImageUrl);
  const title = post.title?.trim() || 'Untitled post';
  const postUrl = normalizeHttpUrl(post.url, '#');

  const parser = document.createElement('div');
  parser.innerHTML = post.content ?? '';
  const fullText = (parser.textContent ?? '').replace(/\s+/g, ' ').trim();
  const snippet = fullText.length > 150 ? `${fullText.slice(0, 150)}…` : fullText;

  const imageContainer = document.createElement('div');
  imageContainer.className = 'news-card-image';
  const image = document.createElement('img');
  image.src = imageUrl;
  image.alt = '';
  image.loading = 'lazy';
  image.addEventListener('error', () => {
    image.src = placeholderImageUrl;
  }, { once: true });
  imageContainer.append(image);

  const content = document.createElement('div');
  content.className = 'news-card-content';
  const heading = document.createElement('h3');
  heading.textContent = title;
  const preview = document.createElement('p');
  preview.textContent = snippet || 'No content preview is available.';
  content.append(heading, preview);

  const actions = document.createElement('div');
  actions.className = 'news-card-actions';
  const feedback = document.createElement('span');
  feedback.className = 'share-feedback';
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.hidden = true;

  const shareButton = document.createElement('md-filled-button');
  shareButton.type = 'button';
  shareButton.textContent = 'Share';
  shareButton.setAttribute('aria-label', `Share “${title}”`);
  shareButton.append(createIcon('share'));
  shareButton.addEventListener('click', async () => {
    if (shareButton.disabled) return;
    shareButton.disabled = true;
    shareButton.setAttribute('aria-busy', 'true');
    try {
      await shareBlogPost({ title, text: snippet, url: postUrl }, feedback);
    } finally {
      shareButton.disabled = false;
      shareButton.removeAttribute('aria-busy');
    }
  });

  const readButton = document.createElement('md-filled-button');
  readButton.setAttribute('href', postUrl);
  readButton.setAttribute('target', '_blank');
  readButton.textContent = 'Read more';
  readButton.append(createIcon('open_in_new'));
  if (postUrl === '#') readButton.setAttribute('disabled', '');

  actions.append(shareButton, readButton, feedback);
  card.append(imageContainer, content, actions);
  return card;
}

function showNewsStatus(status: HTMLElement, message: string, loading = false): void {
  const messageElement = document.createElement('span');
  messageElement.textContent = message;
  const children: Node[] = [];
  if (loading) {
    const progress = document.createElement('md-circular-progress');
    progress.setAttribute('indeterminate', '');
    children.push(progress);
  }
  children.push(messageElement);
  status.replaceChildren(...children);
  status.hidden = false;
}

export async function fetchBlogPosts(): Promise<void> {
  const blogSection = getDynamicElement('blogSection');
  const newsGrid = getDynamicElement('newsGrid');
  const newsStatus = getDynamicElement('news-status');
  if (!blogSection || !newsGrid || !newsStatus) return;

  blogSection.hidden = true;
  showNewsStatus(newsStatus, 'Loading latest posts…', true);
  try {
    const posts = await fetchBloggerPostsData();
    if (!posts.length) {
      newsGrid.replaceChildren(newsStatus);
      blogSection.hidden = true;
      return;
    }

    newsGrid.replaceChildren(...posts.map(createBlogPostCard));
    newsStatus.hidden = true;
    blogSection.hidden = false;
  } catch (error) {
    console.error('Blogger: Failed to load posts.', error);
    newsGrid.replaceChildren(newsStatus);
    newsStatus.hidden = true;
    blogSection.hidden = true;
  }
}

export async function shareBlogPost(
  postData: SharePostData,
  feedbackElement: HTMLElement,
): Promise<void> {
  if (!postData.url || postData.url === '#') {
    displayShareFeedback(feedbackElement, 'This post does not have a shareable link.', true);
    return;
  }

  const copyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(postData.url);
      displayShareFeedback(feedbackElement, 'Link copied to clipboard.');
    } catch (error) {
      console.warn('Blog share: Clipboard access failed.', error);
      window.prompt('Copy this link to share:', postData.url);
      displayShareFeedback(feedbackElement, 'Copy the displayed link to share this post.');
    }
  };

  try {
    if (navigator.share) {
      await navigator.share({
        title: postData.title,
        text: postData.text.slice(0, 200),
        url: postData.url,
      });
      displayShareFeedback(feedbackElement, 'Thanks for sharing!');
    } else {
      await copyLink();
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    console.warn('Blog share: Native sharing failed.', error);
    await copyLink();
  }
}

export function displayShareFeedback(
  feedbackElement: HTMLElement,
  message: string,
  isError = false,
): void {
  const existingTimer = feedbackTimers.get(feedbackElement);
  if (existingTimer) clearTimeout(existingTimer);

  feedbackElement.textContent = message;
  feedbackElement.hidden = false;
  feedbackElement.classList.toggle('error', isError);
  feedbackElement.classList.add('is-visible');

  feedbackTimers.set(feedbackElement, setTimeout(() => {
    feedbackElement.classList.remove('is-visible', 'error');
    feedbackElement.hidden = true;
    feedbackElement.textContent = '';
    feedbackTimers.delete(feedbackElement);
  }, 4000));
}
