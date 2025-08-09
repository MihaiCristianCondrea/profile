
const appConfig = {
    blog: {
        url: 'https://d4rk7355608.blogspot.com/',
        maxResults: 4,
        _getApiKey: function() {
            const keyParts = ["QUl6YVN5Qj", "llZDFmR1puOFd", "yWXdjWmsta1V", "ERG1mclRZUGFY", "YVJz"];
            const encodedKey = keyParts.join('');
            return typeof window !== 'undefined' && window.atob ? window.atob(encodedKey) : '';
        }
    }
};

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
    actionsContainer.appendChild(link);

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

    let blogId = null;
    const currentApiKey = appConfig.blog._getApiKey();
    const currentBlogUrl = appConfig.blog.url;
    const currentMaxResults = appConfig.blog.maxResults;

    if (!currentApiKey) {
        newsStatusElement.style.display = 'flex';
        newsStatusElement.innerHTML = `<span>Configuration error: API key not available.</span>`;
        const loader = newsStatusElement.querySelector('md-circular-progress');
        if (loader) loader.remove();
        return;
    }

    try {
        const blogInfoUrl = `https://www.googleapis.com/blogger/v3/blogs/byurl?url=${encodeURIComponent(currentBlogUrl)}&key=${currentApiKey}`;
        const blogInfoResponse = await fetch(blogInfoUrl);
        if (!blogInfoResponse.ok) {
            const errorData = await blogInfoResponse.json().catch(() => ({}));
            let errorMsg = `Error fetching blog info: ${blogInfoResponse.status} ${blogInfoResponse.statusText}`;
            if (getNestedValue(errorData, 'error.message')) errorMsg += ` - ${getNestedValue(errorData, 'error.message')}`;
            else if (blogInfoResponse.status === 404) errorMsg += ' - Blog URL not found or incorrect.';
            throw new Error(errorMsg);
        }
        const blogInfo = await blogInfoResponse.json();
        blogId = blogInfo.id;
        if (!blogId) throw new Error("Could not retrieve Blog ID from URL.");

        const postsUrl = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${currentApiKey}&maxResults=${currentMaxResults}&fetchImages=true&fetchBodies=true`;
        const postsResponse = await fetch(postsUrl);
        if (!postsResponse.ok) {
            const errorData = await postsResponse.json().catch(() => ({}));
            let errorMsg = `Error fetching posts: ${postsResponse.status} ${postsResponse.statusText}`;
            if (getNestedValue(errorData, 'error.message')) errorMsg += ` - ${getNestedValue(errorData, 'error.message')}`;
            throw new Error(errorMsg);
        }
        const postsData = await postsResponse.json();

        newsStatusElement.style.display = 'none';
        newsGridElement.innerHTML = '';
        if (postsData.items && postsData.items.length > 0) {
            postsData.items.forEach(post => newsGridElement.appendChild(createBlogPostCard(post)));
        } else {
            newsStatusElement.innerHTML = '<span>No posts found.</span>';
            newsStatusElement.style.display = 'flex';
        }
    } catch (error) {
        console.error("Blogger API Error:", error);
        newsStatusElement.style.display = 'flex';
        newsStatusElement.innerHTML = `<span>Failed to load posts. ${error.message}.</span>`;
        const loader = newsStatusElement.querySelector('md-circular-progress');
        if (loader) loader.remove();
    }
}
