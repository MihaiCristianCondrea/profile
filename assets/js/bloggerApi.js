const appConfig = {
    blog: {
        url: 'https://d4rk7355608.blogspot.com/',
        maxResults: 4,
        _getApiKey: function() {
            // Obfuscated API key retrieval
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
    const placeholderImageUrl = `https://via.placeholder.com/600x400/EEEEEE/777777?text=Image+Not+Available`;
    const imageUrl = getNestedValue(post, 'images.0.url') || extractFirstImageFromHtml(post.content) || placeholderImageUrl;
    const title = post.title || 'Untitled Post';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = post.content || ''; // Ensure post.content is treated as HTML
    const snippet = (tempDiv.textContent || tempDiv.innerText || '').substring(0, 150) + ((tempDiv.textContent || tempDiv.innerText || '').length > 150 ? '...' : '');
    const postUrl = post.url || '#';

    card.innerHTML = `
        <div class="news-card-image">
             <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.onerror=null; this.src='${placeholderImageUrl}'; this.alt='Placeholder Image';">
        </div>
        <div class="news-card-content">
             <h3>${title}</h3>
             <p>${snippet || 'No content preview available.'}</p>
        </div>
         <div class="news-card-actions">
             <a href="${postUrl}" target="_blank" rel="noopener noreferrer">
                <md-text-button>Read More</md-text-button>
             </a>
         </div>`;
    return card;
}

/**
 * Fetches blog posts from Blogger API and populates the news grid.
 */
async function fetchBlogPosts() {
    const newsGridElement = getDynamicElement('newsGrid');
    const newsStatusElement = getDynamicElement('news-status');

    if (!newsGridElement || !newsStatusElement) {
        // console.log("Blogger API: News grid or status element not found on current page.");
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

        const postsUrl = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${currentApiKey}&maxResults=${currentMaxResults}&fetchImages=true&fetchBodies=true`; // fetchBodies for post.content
        const postsResponse = await fetch(postsUrl);
        if (!postsResponse.ok) {
            const errorData = await postsResponse.json().catch(() => ({}));
            let errorMsg = `Error fetching posts: ${postsResponse.status} ${postsResponse.statusText}`;
            if (getNestedValue(errorData, 'error.message')) errorMsg += ` - ${getNestedValue(errorData, 'error.message')}`;
            throw new Error(errorMsg);
        }
        const postsData = await postsResponse.json();

        newsStatusElement.style.display = 'none';
        newsGridElement.innerHTML = ''; // Clear previous posts
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