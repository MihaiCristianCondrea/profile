const menuButton = document.getElementById('menuButton');
const navDrawer = document.getElementById('navDrawer');
const closeDrawerButton = document.getElementById('closeDrawerButton');
const drawerOverlay = document.getElementById('drawerOverlay');
const moreToggle = document.getElementById('moreToggle');
const moreContent = document.getElementById('moreContent');
const appsToggle = document.getElementById('appsToggle');
const appsContent = document.getElementById('appsContent');

function openDrawer() {
    if (navDrawer && drawerOverlay) {
        navDrawer.classList.add('open');
        drawerOverlay.classList.add('open');
        closeDrawerButton?.focus();
    }
}

function closeDrawer() {
    if (navDrawer && drawerOverlay) {
        navDrawer.classList.remove('open');
        drawerOverlay.classList.remove('open');
        menuButton?.focus();
    }
}

if (menuButton) menuButton.addEventListener('click', openDrawer);
if (closeDrawerButton) closeDrawerButton.addEventListener('click', closeDrawer);
if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navDrawer?.classList.contains('open')) {
        closeDrawer();
    }
});

function toggleSection(toggleButton, contentElement) {
    if (!toggleButton || !contentElement) return;
    toggleButton.addEventListener('click', () => {
        const isExpanded = contentElement.classList.contains('open');
        if (contentElement.id === 'moreContent' && appsContent.classList.contains('open')) {
            appsContent.classList.remove('open');
            appsToggle.setAttribute('aria-expanded', 'false');
            appsContent.setAttribute('aria-hidden', 'true');
            appsToggle.classList.remove('expanded');
        } else if (contentElement.id === 'appsContent' && moreContent.classList.contains('open')) {
            moreContent.classList.remove('open');
            moreToggle.setAttribute('aria-expanded', 'false');
            moreContent.setAttribute('aria-hidden', 'true');
            moreToggle.classList.remove('expanded');
        }
        contentElement.classList.toggle('open', !isExpanded);
        toggleButton.classList.toggle('expanded', !isExpanded);
        toggleButton.setAttribute('aria-expanded', String(!isExpanded));
        contentElement.setAttribute('aria-hidden', String(isExpanded));
    });
}
toggleSection(moreToggle, moreContent);
toggleSection(appsToggle, appsContent);

const lightThemeButton = document.getElementById('lightThemeButton');
const darkThemeButton = document.getElementById('darkThemeButton');
const autoThemeButton = document.getElementById('autoThemeButton');
const themeButtons = [lightThemeButton, darkThemeButton, autoThemeButton];
const htmlElement = document.documentElement;

function applyTheme(theme) {
    const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)')
        .matches);
    htmlElement.classList.toggle('dark', isDark);

    if (theme === 'light' || theme === 'dark') {
        localStorage.setItem('theme', theme);
    } else {
        localStorage.removeItem('theme');
    }
    updateThemeButtonSelection(theme);
}

function updateThemeButtonSelection(selectedTheme) {
    themeButtons.forEach(button => {
        if (button) {
            button.classList.toggle('selected', button.dataset.theme === selectedTheme);
        }
    });
}

themeButtons.forEach(button => {
    if (button) {
        button.addEventListener('click', () => {
            applyTheme(button.dataset.theme);
        });
    }
});

const savedTheme = localStorage.getItem('theme') || 'auto';
applyTheme(savedTheme);

window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', event => {
        if (!localStorage.getItem('theme')) {
            applyTheme('auto');
        }
    });

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

const newsGrid = document.getElementById('newsGrid');
const newsStatus = document.getElementById('news-status');

const get = (obj, path, defaultValue = undefined) => {
    const travel = regexp =>
        String.prototype.split
        .call(path, regexp)
        .filter(Boolean)
        .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
    const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
    return result === undefined || result === obj ? defaultValue : result;
};

function extractFirstImage(htmlContent) {
    if (!htmlContent) return null;
    const imgTagMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
    if (imgTagMatch && imgTagMatch[1] && !imgTagMatch[1].startsWith('data:image')) {
        return imgTagMatch[1];
    }
    const bloggerImageMatch = htmlContent.match(/(https?:\/\/[^"]+\.googleusercontent\.com\/[^"]+)/);
    if (bloggerImageMatch && bloggerImageMatch[1]) {
        return bloggerImageMatch[1];
    }
    return null;
}

function createNewsCard(post) {
    const card = document.createElement('md-outlined-card');
    card.className = 'news-card';

    const placeholderImageUrl = `https:
    const imageUrl = get(post, 'images.0.url') || extractFirstImage(post.content) || placeholderImageUrl;

    const title = post.title || 'Untitled Post';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = post.content || '';
    const snippet = (tempDiv.textContent || tempDiv.innerText || '')
        .substring(0, 150) + ((tempDiv.textContent || tempDiv.innerText || '')
            .length > 150 ? '...' : '');
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
         </div>
    `;
    return card;
}

async function fetchBlogPosts() {
    if (!newsGrid || !newsStatus) return;

    newsStatus.innerHTML = `<md-circular-progress indeterminate></md-circular-progress><span>Loading latest posts...</span>`;
    newsStatus.style.display = 'flex';

    let blogId = null;
    const currentApiKey = appConfig.blog._getApiKey();
    const currentBlogUrl = appConfig.blog.url;
    const currentMaxResults = appConfig.blog.maxResults;

    if (!currentApiKey) { 
        newsStatus.style.display = 'flex';
        newsStatus.innerHTML = `<span>Configuration error: API key not available.</span>`;
        const loader = newsStatus.querySelector('md-circular-progress');
        if (loader) loader.remove();
        return;
    }

    try {
        const blogInfoUrl = `https:
        const blogInfoResponse = await fetch(blogInfoUrl);

        if (!blogInfoResponse.ok) {
            const errorData = await blogInfoResponse.json().catch(() => ({}));

            let errorMsg = `Error fetching blog info: ${blogInfoResponse.status} ${blogInfoResponse.statusText}`;
            if (get(errorData, 'error.message')) {
                errorMsg += ` - ${get(errorData, 'error.message')}`;
            } else if (blogInfoResponse.status === 404) {
                errorMsg += ' - Blog URL not found or incorrect.';
            }
            throw new Error(errorMsg);
        }

        const blogInfo = await blogInfoResponse.json();
        blogId = blogInfo.id;

        if (!blogId) {
            throw new Error("Could not retrieve Blog ID from URL.");
        }

        const postsUrl = `https:
        const postsResponse = await fetch(postsUrl);

        if (!postsResponse.ok) {
            const errorData = await postsResponse.json().catch(() => ({}));

            let errorMsg = `Error fetching posts: ${postsResponse.status} ${postsResponse.statusText}`;
            if (get(errorData, 'error.message')) {
                errorMsg += ` - ${get(errorData, 'error.message')}`;
            }
            throw new Error(errorMsg);
        }

        const postsData = await postsResponse.json();

        newsStatus.style.display = 'none';
        newsGrid.innerHTML = '';

        if (postsData.items && postsData.items.length > 0) {
            postsData.items.forEach(post => {
                const card = createNewsCard(post);
                newsGrid.appendChild(card);
            });
        } else {
            newsStatus.innerHTML = '<span>No posts found.</span>';
            newsStatus.style.display = 'flex';
        }

    } catch (error) {

        newsStatus.style.display = 'flex';
        newsStatus.innerHTML = `<span>Failed to load posts. ${error.message}.</span>`;
        const loader = newsStatus.querySelector('md-circular-progress');
        if (loader) loader.remove();
    }
}

function setCopyrightYear() {
    const copyrightElement = document.getElementById('copyright-message');
    if (copyrightElement) {
        const currentYear = new Date().getFullYear();
        copyrightElement.textContent = `Copyright © 2025-${currentYear}, D4rK`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchBlogPosts();
    setCopyrightYear();
});