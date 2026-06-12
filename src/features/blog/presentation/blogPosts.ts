// @ts-nocheck

/**
 * Creates an HTML card element for a blog post.
 * @param {object} post - The blog post data from Blogger API.
 * @returns {HTMLElement} The card element.
 */
function createBlogPostCard(post) {
    const card = document.createElement('md-outlined-card');
    card.className = 'news-card';
    const placeholderImageUrl = `assets/images/placeholder.png`;
    const imageUrl = getNestedValue(post, 'images.0.url') || extractFirstImageFromHtml(post.content) || placeholderImageUrl;
    const title = post.title || 'Untitled Post';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = post.content || '';
    const snippet =
        (tempDiv.textContent || tempDiv.innerText || '').substring(0, 150) +
        ((tempDiv.textContent || tempDiv.innerText || '').length > 150 ? '...' : '');
    const postUrl = post.url || '#';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'news-card-image';
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = title;
    img.loading = 'lazy';
    img.onerror = function () {
        this.onerror = null;
        this.src = placeholderImageUrl;
        this.alt = 'Placeholder Image';
    };
    imageContainer.appendChild(img);

    const contentContainer = document.createElement('div');
    contentContainer.className = 'news-card-content';
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    const snippetElement = document.createElement('p');
    snippetElement.textContent = snippet || 'No content preview available.';
    contentContainer.append(titleElement, snippetElement);

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'news-card-actions';

    const shareButton = document.createElement('md-text-button');
    shareButton.type = 'button';
    shareButton.className = 'share-post-button';
    shareButton.textContent = 'Share';
    shareButton.setAttribute('aria-label', title ? `Share “${title}”` : 'Share this post');
    const shareIcon = document.createElement('md-icon');
    shareIcon.setAttribute('slot', 'icon');
    shareIcon.setAttribute('aria-hidden', 'true');
    shareIcon.textContent = 'share';
    shareButton.appendChild(shareIcon);

    const link = document.createElement('a');
    link.href = postUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const textButton = document.createElement('md-text-button');
    textButton.textContent = 'Read More';
    const icon = document.createElement('md-icon');
    icon.setAttribute('slot', 'icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'arrow_forward';
    textButton.appendChild(icon);
    link.appendChild(textButton);

    const shareFeedback = document.createElement('span');
    shareFeedback.className = 'share-feedback';
    shareFeedback.setAttribute('role', 'status');
    shareFeedback.setAttribute('aria-live', 'polite');
    shareFeedback.hidden = true;

    shareButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (shareButton.hasAttribute('disabled')) return;
        shareButton.setAttribute('disabled', '');
        shareButton.setAttribute('aria-busy', 'true');
        try {
            await shareBlogPost({ title, text: snippet, url: postUrl }, shareFeedback);
        } finally {
            shareButton.removeAttribute('disabled');
            shareButton.removeAttribute('aria-busy');
        }
    });

    actionsContainer.append(shareButton, link, shareFeedback);

    card.append(imageContainer, contentContainer, actionsContainer);
    return card;
}

/**
 * Fetches blog posts from Blogger API and populates the news grid.
 */
async function fetchBlogPosts() {
    const newsGridElement = getDynamicElement('newsGrid');
    const newsStatusElement = getDynamicElement('news-status');

    if (!newsGridElement || !newsStatusElement) {
        return;
    }

    newsStatusElement.innerHTML = `<md-circular-progress indeterminate></md-circular-progress><span>Loading latest posts...</span>`;
    newsStatusElement.style.display = 'flex';

    try {
        const postsData = await fetchBloggerPostsData();

        newsStatusElement.style.display = 'none';
        newsGridElement.innerHTML = '';
        if (postsData.items && postsData.items.length > 0) {
            postsData.items.forEach(post => newsGridElement.appendChild(createBlogPostCard(post)));
            if (typeof SiteAnimations !== 'undefined' && SiteAnimations && typeof SiteAnimations.animateNewsCards === 'function') {
                try {
                    SiteAnimations.animateNewsCards(newsGridElement.querySelectorAll('.news-card'));
                } catch (animationError) {
                    console.error('Blogger API: Failed to animate news cards.', animationError);
                }
            }
        } else {
            newsStatusElement.innerHTML = '<span>No posts found.</span>';
            newsStatusElement.style.display = 'flex';
        }
    } catch (error) {
        newsStatusElement.style.display = 'flex';
        const loader = newsStatusElement.querySelector('md-circular-progress');

        if (error && error.message === 'Configuration error: API key not available.') {
            newsStatusElement.innerHTML = `<span>${error.message}</span>`;
            if (loader) loader.remove();
            return;
        }

        console.error("Blogger API Error:", error);
        newsStatusElement.innerHTML = `<span>Failed to load posts. ${error.message}.</span>`;
        if (loader) loader.remove();
    }
}

/**
 * Shares a blog post using the Web Share API with clipboard fallbacks.
 * @param {{ title: string, text: string, url: string }} postData - The data related to the post.
 * @param {HTMLElement} feedbackElement - Element used to provide feedback to the user.
 */
async function shareBlogPost(postData, feedbackElement) {
    const { title, text, url } = postData || {};
    if (!url || url === '#') {
        displayShareFeedback(feedbackElement, 'Unable to share: missing post link.', true);
        return;
    }

    if (typeof navigator === 'undefined') {
        displayShareFeedback(feedbackElement, 'Sharing is not supported in this environment.', true);
        return;
    }

    const normalizedText = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
    const shareTitle = title || 'Check out this post';
    const shareText = normalizedText ? normalizedText.substring(0, 200) : '';

    const fallbackCopyToClipboard = async () => {
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(url);
                displayShareFeedback(feedbackElement, 'Link copied to clipboard.');
                return;
            }
        } catch (clipboardError) {
            console.warn('Clipboard API copy failed:', clipboardError);
        }

        if (typeof document !== 'undefined') {
            try {
                const tempInput = document.createElement('textarea');
                tempInput.value = url;
                tempInput.setAttribute('readonly', '');
                tempInput.style.position = 'fixed';
                tempInput.style.opacity = '0';
                document.body.appendChild(tempInput);
                tempInput.focus();
                tempInput.select();
                const copied = document.execCommand && document.execCommand('copy');
                document.body.removeChild(tempInput);
                if (copied) {
                    displayShareFeedback(feedbackElement, 'Link copied to clipboard.');
                    return;
                }
            } catch (legacyError) {
                console.warn('Legacy clipboard fallback failed:', legacyError);
            }
        }

        if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
            window.prompt('Copy this link to share:', url);
        }
        displayShareFeedback(feedbackElement, 'Copy the link shown to share this post.');
    };

    try {
        if (navigator.share && typeof navigator.share === 'function') {
            const sharePayload = { title: shareTitle, url };
            if (shareText) sharePayload.text = shareText;
            await navigator.share(sharePayload);
            displayShareFeedback(feedbackElement, 'Thanks for sharing!');
        } else {
            await fallbackCopyToClipboard();
        }
    } catch (error) {
        if (error && error.name === 'AbortError') {
            return;
        }
        console.warn('Web Share API failed, using clipboard fallback.', error);
        await fallbackCopyToClipboard();
    }
}

/**
 * Displays temporary feedback after share actions.
 * @param {HTMLElement} feedbackElement - Element used to display the message.
 * @param {string} message - The message to display.
 * @param {boolean} [isError=false] - Whether the message represents an error.
 */
function displayShareFeedback(feedbackElement, message, isError = false) {
    if (!feedbackElement) return;

    if (feedbackElement._hideTimeoutId) {
        clearTimeout(feedbackElement._hideTimeoutId);
    }

    feedbackElement.textContent = message;
    feedbackElement.hidden = false;
    feedbackElement.classList.toggle('error', Boolean(isError));
    feedbackElement.classList.add('is-visible');

    feedbackElement._hideTimeoutId = setTimeout(() => {
        feedbackElement.classList.remove('is-visible');
        feedbackElement.classList.remove('error');
        feedbackElement.hidden = true;
        feedbackElement.textContent = '';
        feedbackElement._hideTimeoutId = null;
    }, 4000);
}


if (typeof globalThis !== 'undefined') {
    Object.assign(globalThis, {
        createBlogPostCard,
        fetchBlogPosts,
        shareBlogPost,
        displayShareFeedback
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createBlogPostCard,
        fetchBlogPosts,
        shareBlogPost,
        displayShareFeedback
    };
}
