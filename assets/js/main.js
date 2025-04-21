// assets/js/main.js

// --- Element References ---
const menuButton = document.getElementById('menuButton');
const navDrawer = document.getElementById('navDrawer');
const closeDrawerButton = document.getElementById('closeDrawerButton');
const drawerOverlay = document.getElementById('drawerOverlay');
const moreToggle = document.getElementById('moreToggle');
const moreContent = document.getElementById('moreContent');
const appsToggle = document.getElementById('appsToggle');
const appsContent = document.getElementById('appsContent');
const body = document.body;
const themeSegmentedButtonSet = document.getElementById('themeSegmentedButtonSet');
const htmlElement = document.documentElement;

// --- Portfolio Dialog Elements ---
const viewPortfolioButton = document.getElementById('viewPortfolioButton'); // Use ID selector
const portfolioDialog = document.getElementById('portfolioDialog');
const dialogContent = document.getElementById('dialogContent');
const closePortfolioDialogButton = document.getElementById('closePortfolioDialogButton'); // Get close button


// --- Constants for App Fetching ---
const DEVELOPER_ID = "5390214922640123642";
// --- Using allorigins.win proxy ---
// WARNING: Client-side scraping via proxies is UNRELIABLE and likely to break
//          if Google changes their site or blocks the proxy.
//          A SERVER-SIDE solution is strongly recommended for stability.
const CORS_PROXY_URL = "https://api.allorigins.win/raw?url=";
const PLAY_STORE_RAW_URL = `https://play.google.com/store/apps/dev?id=${DEVELOPER_ID}&hl=en&gl=us`;
const DEVELOPER_PAGE_URL = `${CORS_PROXY_URL}${encodeURIComponent(PLAY_STORE_RAW_URL)}`;

const DEFAULT_ICON_URL = "https://c.clc2l.com/t/g/o/google-playstore-Iauj7q.png";
const PLAY_STORE_APP_URL = "https://play.google.com/store/apps/details?id=";


// --- Drawer Logic ---
function openDrawer() {
    if (navDrawer && drawerOverlay) {
        navDrawer.classList.add('open');
        drawerOverlay.classList.add('open');
        body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeDrawer() {
    if (navDrawer && drawerOverlay) {
        navDrawer.classList.remove('open');
        drawerOverlay.classList.remove('open');
        body.style.overflow = ''; // Restore background scrolling
    }
}

// --- Collapsible Section Logic ---
function toggleSection(toggleButton, contentElement) {
    if (!toggleButton || !contentElement) return; // Guard clause

    toggleButton.addEventListener('click', () => {
        const isExpanded = contentElement.classList.contains('open');
        const icon = toggleButton.querySelector('md-icon[slot="end"] span');

        // Simple accordion: Close other sections
        if (contentElement.id === 'moreContent' && appsContent?.classList.contains('open')) {
            appsContent.classList.remove('open');
            appsToggle?.classList.remove('expanded');
            const appsIcon = appsToggle?.querySelector('md-icon[slot="end"] span');
            if (appsIcon) appsIcon.textContent = 'expand_more';
        } else if (contentElement.id === 'appsContent' && moreContent?.classList.contains('open')) {
            moreContent.classList.remove('open');
            moreToggle?.classList.remove('expanded');
            const moreIcon = moreToggle?.querySelector('md-icon[slot="end"] span');
            if (moreIcon) moreIcon.textContent = 'expand_more';
        }

        // Toggle current section
        contentElement.classList.toggle('open', !isExpanded);
        toggleButton.classList.toggle('expanded', !isExpanded);

        // Update icon for the clicked item
        if (icon) {
            icon.textContent = !isExpanded ? 'expand_less' : 'expand_more';
        }
    });
}


// --- Theme Toggle Logic ---
function applyTheme(theme) {
    console.log("Applying theme:", theme); // Log theme being applied
    htmlElement.classList.remove('dark'); // Always remove dark first

    if (theme === 'dark') {
        htmlElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (themeSegmentedButtonSet) {
            themeSegmentedButtonSet.selected = 'dark';
            console.log("Set segmented button to dark");
        }
    } else if (theme === 'light') {
        localStorage.setItem('theme', 'light');
        if (themeSegmentedButtonSet) {
            themeSegmentedButtonSet.selected = 'light';
            console.log("Set segmented button to light");
        }
    } else { // Auto theme ('auto' or null/undefined)
        localStorage.removeItem('theme');
        if (themeSegmentedButtonSet) {
            themeSegmentedButtonSet.selected = 'auto';
             console.log("Set segmented button to auto");
        }
        // Apply system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            htmlElement.classList.add('dark');
            console.log("Auto theme: Applied dark based on system preference.");
        } else {
             console.log("Auto theme: Applied light based on system preference.");
        }
    }
}

// --- Portfolio Dialog Logic ---

function showDialogLoading() {
    if (dialogContent) {
        dialogContent.innerHTML = `
            <div class="dialog-loading">
              <md-circular-progress indeterminate></md-circular-progress>
              <p>Loading apps...</p>
            </div>`;
    }
}

function showDialogError(message = "Failed to load apps.") {
     if (dialogContent) {
        // Add a more specific warning about scraping issues
        let fullMessage = message;
        if (message.includes("parsing") || message.includes("extract")) {
            fullMessage += " (The website structure might have changed, making scraping unreliable.)";
        } else if (message.includes("Network error")) {
             fullMessage += " (Could not reach the data source via the proxy.)";
        }

        dialogContent.innerHTML = `
            <div class="dialog-error">
              <md-icon>warning</md-icon> {/* Changed icon */}
              <p>${fullMessage}</p>
            </div>`;
    }
}

function createAppCardElement(appInfo) {
    const card = document.createElement('a');
    card.href = `${PLAY_STORE_APP_URL}${appInfo.packageName}`;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.className = 'app-card';
    card.title = `${appInfo.name} - ${appInfo.packageName}`;

    const img = document.createElement('img');
    img.src = appInfo.iconUrl || DEFAULT_ICON_URL;
    img.alt = `${appInfo.name} Icon`;
    img.loading = "lazy"; // Add lazy loading for images
    img.onerror = () => { img.src = DEFAULT_ICON_URL; };

    const name = document.createElement('p');
    name.textContent = appInfo.name;

    card.appendChild(img);
    card.appendChild(name);
    return card;
}


function displayAppsInDialog(apps) {
     if (!dialogContent) return;

    if (!apps || apps.length === 0) {
         console.log("displayAppsInDialog called with no apps found.");
         // Error message is now more specific in showDialogError if parsing failed earlier
         showDialogError("No apps found or unable to parse data.");
         return;
    }

    console.log(`Displaying ${apps.length} apps.`);
    dialogContent.innerHTML = ''; // Clear previous content
    const grid = document.createElement('div');
    grid.className = 'portfolio-grid';

    // Sort apps alphabetically before displaying
    apps.sort((a, b) => a.name.localeCompare(b.name));

    apps.forEach(app => {
        const card = createAppCardElement(app);
        grid.appendChild(card);
    });

    dialogContent.appendChild(grid);
}

// --- Functions for Scraping (Highly Unreliable) ---

function extractJsonData(htmlContent) {
    console.log("Attempting to extract JSON data...");
    let relevantJsonString = null;
    let extractionMethod = "None";

    try {
        // Method 1: AF_initDataCallback (Primary Target)
        const dataCallbackRegex = /AF_initDataCallback\s*\(\s*(\{.*?\})\s*\)\s*;/gs;
        let match;
        while ((match = dataCallbackRegex.exec(htmlContent)) !== null) {
            const callbackContent = match[1];
            if (callbackContent && callbackContent.match(/['"]ds:\d+['"]/)) {
                const dataRegex = /data\s*:\s*(\[.*?\])\s*,\s*sideChannel/s;
                let dataMatch = callbackContent.match(dataRegex);
                if (dataMatch && dataMatch[1]) {
                    relevantJsonString = dataMatch[1];
                    extractionMethod = "AF_initDataCallback ('data:' key)";
                    break;
                } else {
                    const arrayRegex = /(\[.*\])/s;
                    const arrayMatch = callbackContent.match(arrayRegex);
                    if (arrayMatch && arrayMatch[1] && arrayMatch[1].length > 500) {
                        relevantJsonString = arrayMatch[1];
                        extractionMethod = "AF_initDataCallback (fallback array regex)";
                        break;
                    }
                }
            }
        }

        // Method 2: Script Tag Fallback
        if (!relevantJsonString) {
            console.log("AF_initDataCallback failed, trying script tag regex...");
            const scriptRegex = /<script[^>]*nonce="[^"]+"[^>]*>\s*(.*?)\s*<\/script>/gs;
            while ((match = scriptRegex.exec(htmlContent)) !== null) {
                const scriptContent = match[1];
                 if (scriptContent && scriptContent.includes(DEVELOPER_ID) && scriptContent.includes('"ds:')) {
                    const jsonLikeRegex = /return\s+(\[.*\])\s*;\s*\}\)\(\);/s;
                    let potentialJsonMatch = scriptContent.match(jsonLikeRegex);
                    if (potentialJsonMatch && potentialJsonMatch[1]) {
                        relevantJsonString = potentialJsonMatch[1];
                    } else {
                        const assignRegex = /(?:var|const|let)\s+\w+\s*=\s*(\[.*\])\s*;/s;
                        potentialJsonMatch = scriptContent.match(assignRegex);
                        if (potentialJsonMatch && potentialJsonMatch[1]) {
                            relevantJsonString = potentialJsonMatch[1];
                        }
                    }
                    if (relevantJsonString && relevantJsonString.length > 1000) {
                         extractionMethod = "Script Tag Regex";
                        break;
                    } else {
                        relevantJsonString = null; // Reset if match wasn't good
                    }
                }
            }
        }

        if (!relevantJsonString) {
            console.error("Failed to find relevant JSON structure in the HTML.");
            throw new Error("Failed to extract JSON data structure from HTML.");
        }

        console.log(`JSON extraction successful using method: ${extractionMethod}`);
        // console.log("Raw JSON string snippet:", relevantJsonString.substring(0, 200) + "...");

        // Clean before parsing
        let cleanedJsonString = relevantJsonString
            .replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16))) // Handle \x hex escapes
            .replace(/undefined/g, 'null')
            .replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas

        // console.log("Cleaned JSON string snippet:", cleanedJsonString.substring(0, 200) + "...");
        const jsonData = JSON.parse(cleanedJsonString);
        console.log("JSON parsing successful.");
        return jsonData;

    } catch (error) {
        console.error(`Error during JSON extraction/parsing (Method: ${extractionMethod}):`, error);
        console.error("Failed HTML snippet:", htmlContent.substring(0, 1000)); // Log beginning of HTML that failed
        console.error("Failed JSON string snippet:", relevantJsonString?.substring(0, 500));
        throw new Error(`Error parsing developer page data: ${error.message}`);
    }
}

function searchForApps(jsonElement) {
    console.log("Searching for apps within parsed JSON data...");
    const appInfos = [];
    const knownPackages = new Set();
    let appsFoundCount = 0;

    function flattenData(element) {
        let results = [];
        if (typeof element === 'string') {
            if (element.length < 200 && !element.startsWith('data:image')) { // Avoid overly long strings/base64
                 results.push(element);
            }
        } else if (Array.isArray(element)) {
            element.forEach(item => { results = results.concat(flattenData(item)); });
        } else if (typeof element === 'object' && element !== null) {
            Object.values(element).forEach(value => { results = results.concat(flattenData(value)); });
        }
         // Also add numbers, they might be relevant for filtering later (like ratings)
         else if (typeof element === 'number') {
             results.push(element.toString()); // Convert numbers to string for consistent processing
         }
        return results;
    }

    function traverse(element) {
        if (Array.isArray(element) && element.length > 5) { // Heuristic: Look in reasonably sized arrays
            const flatData = flattenData(element); // Flatten only this specific array level
            const packageName = flatData.find(s => typeof s === 'string' && s.startsWith("com.") && !s.includes("google") && s.split('.').length >= 2 && s.length < 100);
            const potentialIcon = flatData.find(s => typeof s === 'string' && s.startsWith("https://play-lh.googleusercontent.com"));

            if (packageName && potentialIcon && !knownPackages.has(packageName)) {
                let iconUrl = flatData.find(s => typeof s === 'string' && s.startsWith("https://play-lh.googleusercontent.com") && s.includes('=') && s.match(/\.(png|jpg|jpeg|webp)/i));
                iconUrl = iconUrl || potentialIcon || DEFAULT_ICON_URL;

                let appName = flatData.find(s =>
                    typeof s === 'string' &&
                    s !== packageName && !s.startsWith("http") && !s.startsWith("com.") &&
                    s.length > 1 && s.length < 70 && // Adjusted length
                    !/^\d+(\.\d+)?(M|k|B)?\+?$/.test(s) && // Exclude numbers/counts/ratings
                     !/stars?|reviews?|downloads?|installs?|developer|ratings?/i.test(s) && // Exclude common meta words
                    s !== "Install" && s !== "Installed" && s !== "Update" && s !== "Free" && s !== "Open" && // Buttons
                    !/contains ads|in-app purchases/i.test(s) &&
                    s.match(/[a-zA-Z]/)
                );

                 // Simpler fallback: just take the first plausible string if complex logic fails
                 if (!appName) {
                     appName = flatData.find(s => typeof s === 'string' && s.length > 1 && s.length < 70 && s.match(/[a-zA-Z]/) && !s.startsWith("http") && !s.startsWith("com.") && !/^\d/.test(s) );
                 }

                appName = appName || packageName; // Final fallback

                if (packageName && appName && iconUrl) {
                    appInfos.push({
                        name: appName.trim(),
                        iconUrl: iconUrl,
                        packageName: packageName
                    });
                    knownPackages.add(packageName);
                    appsFoundCount++;
                }
            }
        }

        // Continue traversal deeper into arrays and objects
        if (Array.isArray(element)) {
            element.forEach(traverse);
        } else if (typeof element === 'object' && element !== null) {
            Object.values(element).forEach(traverse);
        }
    }

    try {
        traverse(jsonElement);
        console.log(`App search finished. Found ${appsFoundCount} potential apps.`);
    } catch(error) {
         console.error("Error during app data traversal:", error);
         // Don't throw here, just return whatever was found
    }
    return appInfos;
}


// Main function to fetch and display apps
async function fetchAndDisplayDeveloperApps() {
    if (!portfolioDialog || !dialogContent) {
        console.error("Portfolio dialog or content area not found.");
        return;
    }

    portfolioDialog.show();
    showDialogLoading();

    try {
        console.log(`Fetching from proxy: ${DEVELOPER_PAGE_URL}`);
        const response = await fetch(DEVELOPER_PAGE_URL, {
            mode: 'cors',
            // Set a timeout for the fetch request (e.g., 15 seconds)
            signal: AbortSignal.timeout(15000)
        });

        const responseText = await response.text();

        if (!response.ok) {
             console.error(`HTTP error ${response.status} from proxy/target. Status: ${response.statusText}. Response snippet:`, responseText.substring(0, 500));
             let errorMsg = `Network error: ${response.status} ${response.statusText}.`;
             if (response.status === 403) errorMsg += " Access Forbidden - Google likely blocked the proxy.";
             else if (response.status === 404) errorMsg += " Not Found - Check the Play Store URL.";
             else if (response.status >= 500) errorMsg += " Server error from proxy or Google.";
             else errorMsg += " Check proxy or target URL.";
             throw new Error(errorMsg);
         }

        // console.log("Fetched HTML successfully. Length:", responseText.length);
        const htmlContent = responseText;
        const jsonData = extractJsonData(htmlContent); // Can throw error
        const apps = searchForApps(jsonData); // Can return empty array

        displayAppsInDialog(apps); // Handles empty array case

    } catch (error) {
        console.error("Failed to fetch or process developer apps:", error);
        // Distinguish fetch timeout from other errors
        if (error.name === 'TimeoutError') {
             showDialogError("Loading apps timed out. Please try again later.");
        } else {
             showDialogError(error.message || "An unexpected error occurred while loading apps.");
        }
    }
}


// --- Event Listeners ---

// --- Drawer Listeners ---
if (menuButton) { menuButton.addEventListener('click', openDrawer); } else { console.error("Menu button not found"); }
if (closeDrawerButton) { closeDrawerButton.addEventListener('click', closeDrawer); } else { console.error("Close drawer button not found"); }
if (drawerOverlay) { drawerOverlay.addEventListener('click', closeDrawer); } else { console.error("Drawer overlay not found"); }

// --- Collapsible Section Listeners ---
toggleSection(moreToggle, moreContent);
toggleSection(appsToggle, appsContent);
if (!moreToggle || !moreContent) console.warn("More toggle/content not found");
if (!appsToggle || !appsContent) console.warn("Apps toggle/content not found");


// --- Theme Toggle Listener ---
if (themeSegmentedButtonSet) {
     themeSegmentedButtonSet.addEventListener('segmented-button-set-selection', (e) => {
        const selectedValue = e.detail.button.value;
        applyTheme(selectedValue);
        // Optional: closeDrawer();
    });
} else {
    console.error("Theme segmented button set not found");
}

// --- Portfolio Button & Dialog Close Listener ---
if (viewPortfolioButton && portfolioDialog) {
    viewPortfolioButton.addEventListener('click', fetchAndDisplayDeveloperApps);
} else {
     console.error("Could not find View Portfolio button and/or Dialog element in the DOM.");
}

if (closePortfolioDialogButton && portfolioDialog) {
    closePortfolioDialogButton.addEventListener('click', () => {
        portfolioDialog.close("close-button-clicked"); // Pass optional reason
    });
} else {
     console.error("Could not find Portfolio Dialog Close button and/or Dialog element in the DOM.");
}


// --- Initial Theme Application ---
// Defer slightly to ensure components might be ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded, applying initial theme...");
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme('auto'); // Default to auto
    }

    // Re-check button state after initial applyTheme, sometimes MWC needs a nudge
    const currentTheme = localStorage.getItem('theme') || 'auto';
     if (themeSegmentedButtonSet) {
         // Small delay might help ensure the component is fully ready for property setting
         setTimeout(() => {
              themeSegmentedButtonSet.selected = currentTheme;
              console.log(`Set initial segmented button state to: ${currentTheme}`);
         }, 50); // 50ms delay, adjust if needed
    }
});


// --- System Theme Change Listener ---
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
try {
    mediaQuery.addEventListener('change', event => {
        // Only apply if theme is set to 'auto' (no preference saved)
        if (!localStorage.getItem('theme')) {
             console.log("System theme changed, applying auto theme...");
             applyTheme('auto'); // Re-apply auto logic
        }
    });
} catch (e) {
    // Fallback for older browsers that might not support addEventListener on MediaQueryList
    try {
         mediaQuery.addListener(event => { // Deprecated but needed for fallback
            if (!localStorage.getItem('theme')) {
                 console.log("System theme changed (legacy listener), applying auto theme...");
                 applyTheme('auto');
            }
        });
    } catch (e2) {
        console.error("Error adding system theme change listener:", e2);
    }
}


// --- Swipe To Open Drawer Logic ---
let touchStartX = 0;
let touchEndX = 0;
const swipeThreshold = 50; // Min pixels swiped
const edgeThreshold = 40;  // Max distance from left edge
let isPotentiallySwiping = false;

console.log("Swipe detection initialized.");

body.addEventListener('touchstart', (e) => {
    const targetElement = e.target;
    // Check if touch is inside the dialog, on a button/link, or scrollable area
    if (targetElement.closest('md-dialog') ||
        targetElement.closest('button, a, md-icon-button, md-text-button, md-filled-button, md-outlined-button, md-chip') ||
        targetElement.closest('[data-swipe-ignore]') || // Add a data attribute for specific ignore areas if needed
        window.getComputedStyle(targetElement).overflowY === 'scroll' || // Ignore direct touch on scrollable elements
        targetElement.closest('[style*="overflow: auto"], [style*="overflow-y: scroll"]') // Basic check for inline scroll styles
        ) {
        isPotentiallySwiping = false;
        touchStartX = 0;
        // console.log("Swipe ignored: touch started on interactive/scrollable/dialog element.");
        return;
    }

    const startX = e.touches[0].clientX;
    if (startX < edgeThreshold && !navDrawer.classList.contains('open')) {
        touchStartX = startX;
        touchEndX = touchStartX;
        isPotentiallySwiping = true;
        // console.log(`Potential swipe started at X: ${startX}`);
    } else {
        isPotentiallySwiping = false;
        touchStartX = 0;
    }
}, { passive: true });

body.addEventListener('touchmove', (e) => {
    if (!isPotentiallySwiping) return;
    touchEndX = e.touches[0].clientX;
}, { passive: true });

body.addEventListener('touchend', (e) => {
    if (!isPotentiallySwiping) return;

    const deltaX = touchEndX - touchStartX;
    // console.log(`Touchend: deltaX=${deltaX}`);

    if (deltaX > swipeThreshold) {
        // Double check we didn't end the touch over an interactive element accidentally
        const endTarget = document.elementFromPoint(touchEndX, e.changedTouches[0].clientY); // Find element under touch end
         if (!endTarget || !endTarget.closest('button, a, md-icon-button, md-text-button, md-filled-button, md-outlined-button, md-chip')) {
              console.log(`Swipe detected (deltaX: ${deltaX}), opening drawer.`);
              openDrawer();
         } else {
              // console.log("Swipe finished over interactive element, ignoring.");
         }
    }

    // Reset regardless
    isPotentiallySwiping = false;
    touchStartX = 0;
    touchEndX = 0;
});
// --- End Swipe Logic ---

console.log("Main script execution finished.");