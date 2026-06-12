// @ts-nocheck

const appConfig = {
    blog: {
        url: 'https://d4rk7355608.blogspot.com/',
        maxResults: 4,
        _getApiKey: function() {
            const encodedKey = 'QUl6YVN5QXVqb0dXcUhIR1ZuYjh6eXZDUEdLWnJkajc5TFRCUFQw';
            return typeof window !== 'undefined' && window.atob ? window.atob(encodedKey) : '';
        }
    }
};

async function fetchBloggerPostsData(config = appConfig.blog) {
    let blogId = null;
    const currentApiKey = config._getApiKey();
    const currentBlogUrl = config.url;
    const currentMaxResults = config.maxResults;

    if (!currentApiKey) {
        throw new Error('Configuration error: API key not available.');
    }

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
    if (!blogId) throw new Error('Could not retrieve Blog ID from the provided URL.');

    const postsUrl = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${currentApiKey}&maxResults=${currentMaxResults}&fetchImages=true&fetchBodies=true`;
    const postsResponse = await fetch(postsUrl);
    if (!postsResponse.ok) {
        const errorData = await postsResponse.json().catch(() => ({}));
        let errorMsg = `Error fetching posts: ${postsResponse.status} ${postsResponse.statusText}`;
        if (getNestedValue(errorData, 'error.message')) errorMsg += ` - ${getNestedValue(errorData, 'error.message')}`;
        throw new Error(errorMsg);
    }

    return postsResponse.json();
}

if (typeof globalThis !== 'undefined') {
    Object.assign(globalThis, {
        appConfig,
        fetchBloggerPostsData
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        appConfig,
        fetchBloggerPostsData
    };
}
