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
const viewPortfolioButton = document.getElementById('viewPortfolioButton');
const portfolioDialog = document.getElementById('portfolioDialog');
const dialogContent = document.getElementById('dialogContent');
const closePortfolioDialogButton = document.getElementById('closePortfolioDialogButton');


// --- Constants for App Fetching ---
const DEVELOPER_ID = "5390214922640123642";
// WARNING: Client-side scraping via proxies is UNRELIABLE. SERVER-SIDE is recommended.
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
        body.style.overflow = 'hidden';
    }
}

function closeDrawer() {
    if (navDrawer && drawerOverlay) {
        navDrawer.classList.remove('open');
        drawerOverlay.classList.remove('open');
        body.style.overflow = '';
    }
}

// --- Collapsible Section Logic ---
function toggleSection(toggleButton, contentElement) {
    if (!toggleButton || !contentElement) return;

    toggleButton.addEventListener('click', () => {
        const isExpanded = contentElement.classList.contains('open');
        const icon = toggleButton.querySelector('md-icon[slot="end"] span');

        // Simple accordion
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

        contentElement.classList.toggle('open', !isExpanded);
        toggleButton.classList.toggle('expanded', !isExpanded);
        if (icon) {
            icon.textContent = !isExpanded ? 'expand_less' : 'expand_more';
        }
    });
}


// --- Theme Toggle Logic ---
function applyTheme(theme) {
    console.log("Applying theme:", theme);
    htmlElement.classList.remove('dark');

    if (theme === 'dark') {
        htmlElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (themeSegmentedButtonSet) themeSegmentedButtonSet.selected = 'dark';
        console.log("Theme set to dark");
    } else if (theme === 'light') {
        localStorage.setItem('theme', 'light');
        if (themeSegmentedButtonSet) themeSegmentedButtonSet.selected = 'light';
         console.log("Theme set to light");
    } else { // Auto theme
        localStorage.removeItem('theme');
        if (themeSegmentedButtonSet) themeSegmentedButtonSet.selected = 'auto';
        console.log("Theme set to auto");
        if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
            htmlElement.classList.add('dark');
             console.log("Auto theme: Applied dark (system)");
        } else {
             console.log("Auto theme: Applied light (system)");
        }
    }
}

// --- Portfolio Dialog Logic ---

function showDialogLoading() {
    if (dialogContent) {
        dialogContent.innerHTML = `
            <div class="dialog-loading">
              <md-circular-progress indeterminate aria-label="Loading apps"></md-circular-progress>
              <p>Loading apps...</p>
            </div>`;
    }
}

function showDialogError(message = "Failed to load apps.") {
     if (dialogContent) {
        let fullMessage = message;
        if (message.includes("parsing") || message.includes("extract")) {
            fullMessage += " (Website structure may have changed.)";
        } else if (message.includes("Network error")) {
             fullMessage += " (Could not reach data source.)";
        }
        console.error("showDialogError:", fullMessage); // Log the error being shown
        dialogContent.innerHTML = `
            <div class="dialog-error">
              <md-icon>warning</md-icon>
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
    img.loading = "lazy";
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
         console.warn("displayAppsInDialog called but no apps were found or provided.");
         showDialogError("No apps found. The website layout might have changed."); // More specific error
         return;
    }

    console.log(`Displaying ${apps.length} apps in dialog.`);
    dialogContent.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'portfolio-grid';

    apps.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    apps.forEach(app => {
        const card = createAppCardElement(app);
        grid.appendChild(card);
    });

    dialogContent.appendChild(grid);
}

// --- Functions for Scraping (Highly Unreliable) ---

function extractJsonData(htmlContent) {
    console.log("Extracting JSON data...");
    let relevantJsonString = null;
    let extractionMethod = "None";

    try {
        // Method 1: AF_initDataCallback
        const dataCallbackRegex = /AF_initDataCallback\s*\(\s*(\{.*?\})\s*\)\s*;/gs;
        let match;
        while ((match = dataCallbackRegex.exec(htmlContent)) !== null) {
            const callbackContent = match[1];
            if (callbackContent && callbackContent.match(/['"]ds:\d+['"]/)) { // Look for ds:N pattern
                const dataRegex = /data\s*:\s*(\[.*?\])\s*,\s*sideChannel/s; // Try to find the "data" array
                let dataMatch = callbackContent.match(dataRegex);
                if (dataMatch && dataMatch[1]) {
                    relevantJsonString = dataMatch[1];
                    extractionMethod = "AF_initDataCallback ('data:' key)";
                    break;
                } else { // Fallback: try largest array in the callback
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

        // Method 2: Script Tag Fallback (Less reliable)
        if (!relevantJsonString) {
            console.log("AF_initDataCallback failed, trying script tag regex...");
            const scriptRegex = /<script[^>]*nonce="[^"]+"[^>]*>\s*(.*?)\s*<\/script>/gs;
            while ((match = scriptRegex.exec(htmlContent)) !== null) {
                 const scriptContent = match[1];
                 if (scriptContent && scriptContent.includes(DEVELOPER_ID) && scriptContent.includes('"ds:')) {
                    const jsonLikeRegex = /return\s+(\[.*\])\s*;\s*\}\)\(\);/s;
                    let potentialJsonMatch = scriptContent.match(jsonLikeRegex);
                    if (!potentialJsonMatch) {
                        const assignRegex = /(?:var|const|let)\s+\w+\s*=\s*(\[.*\])\s*;/s;
                        potentialJsonMatch = scriptContent.match(assignRegex);
                    }
                    if (potentialJsonMatch && potentialJsonMatch[1] && potentialJsonMatch[1].length > 1000) {
                         relevantJsonString = potentialJsonMatch[1];
                         extractionMethod = "Script Tag Regex";
                         break;
                     }
                }
            }
        }

        if (!relevantJsonString) {
            console.error("Failed to find relevant JSON structure in the HTML after trying multiple methods.");
            throw new Error("Failed to extract JSON data structure from HTML.");
        }

        console.log(`JSON extraction successful using method: ${extractionMethod}`);

        // Clean before parsing
        let cleanedJsonString = relevantJsonString
            .replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/undefined/g, 'null')
            .replace(/,\s*([\]}])/g, '$1');

        const jsonData = JSON.parse(cleanedJsonString);
        console.log("JSON parsing successful.");
        // Log top-level structure of parsed data
        if (Array.isArray(jsonData)) {
            console.log(`Parsed data is an Array with ${jsonData.length} elements.`);
        } else if (typeof jsonData === 'object' && jsonData !== null) {
            console.log(`Parsed data is an Object with keys: ${Object.keys(jsonData).join(', ')}`);
        } else {
            console.log("Parsed data type:", typeof jsonData);
        }
        return jsonData;

    } catch (error) {
        console.error(`Error during JSON extraction/parsing (Method: ${extractionMethod}):`, error);
        console.error("Failed HTML snippet:", htmlContent.substring(0, 1000));
        console.error("Failed JSON string snippet:", relevantJsonString?.substring(0, 500));
        throw new Error(`Error parsing developer page data: ${error.message}`);
    }
}

// **** REVISED searchForApps function ****
function searchForApps(jsonElement) {
    console.log("--- Starting searchForApps ---");
    const appInfos = [];
    const knownPackages = new Set();
    let arraysChecked = 0;
    let potentialAppsFound = 0;

    // Helper to flatten only strings from immediate children or grandchildren (more controlled)
    function getRelevantStrings(element, depth = 0, maxDepth = 2) {
        let strings = [];
        if (depth > maxDepth) return strings;

        if (typeof element === 'string' && element.length < 200 && !element.startsWith('data:image')) {
            strings.push(element);
        } else if (Array.isArray(element)) {
            element.forEach(item => { strings = strings.concat(getRelevantStrings(item, depth + 1, maxDepth)); });
        } else if (typeof element === 'object' && element !== null && depth < maxDepth) { // Limit object depth
            Object.values(element).forEach(value => { strings = strings.concat(getRelevantStrings(value, depth + 1, maxDepth)); });
        }
        return strings;
    }

    function traverse(element, path = "root") {
        // *** Focus primarily on processing Arrays, like the Kotlin code ***
        if (Array.isArray(element)) {
            arraysChecked++;
            // console.log(`Checking Array at path: ${path} (Length: ${element.length})`); // Verbose logging

            // Get strings specifically within *this* array and its direct children
            const currentLevelStrings = getRelevantStrings(element);
            // console.log(`  Strings found in this array level: [${currentLevelStrings.join(', ')}]`); // Log strings

            // --- Try to find app data within this array, mimicking Kotlin logic ---
            const packageName = currentLevelStrings.find(s => s.startsWith("com.") && !s.includes("google") && s.split('.').length >= 2 && s.length < 100);

            if (packageName && !knownPackages.has(packageName)) {
                console.log(`  Potential package found: ${packageName} in array at ${path}`);
                potentialAppsFound++;

                // Find Icon URL within the same set of strings
                let iconUrl = currentLevelStrings.find(s => s.startsWith("https://play-lh.googleusercontent.com") && s.includes('=') && s.match(/\.(png|jpg|jpeg|webp)/i));
                iconUrl = iconUrl || DEFAULT_ICON_URL; // Fallback

                // Find App Name
                let appName = null;

                // 1. Try Kotlin's index heuristic (element[3])
                if (element.length > 3 && typeof element[3] === 'string' && element[3] !== 'null' && element[3].match(/[a-zA-Z]/) && element[3].length < 50) {
                     appName = element[3];
                     console.log(`    Found name using index [3]: ${appName}`);
                }

                // 2. Try Kotlin's alternative name heuristic (within currentLevelStrings)
                if (!appName) {
                    appName = currentLevelStrings.find(s =>
                        s !== packageName &&
                        !s.startsWith("https://") &&
                        s.match(/[a-zA-Z]/) &&
                        s.length > 1 && s.length < 50 &&
                        !/^\d+(\.\d+)?(M|k|B)?\+?$/.test(s) && // Exclude numbers/counts/ratings
                        !/stars?|reviews?|downloads?|installs?|developer|ratings?|null/i.test(s) && // Exclude meta words and 'null'
                        s !== "Install" && s !== "Installed" && s !== "Update" && s !== "Free" && s !== "Open"
                     );
                     if (appName) {
                         console.log(`    Found name using alternative heuristic: ${appName}`);
                     }
                }

                // 3. Final fallback to package name
                appName = appName || packageName;
                 if (appName === packageName) {
                     console.log(`    Could not find specific name, falling back to package name.`);
                 }

                 console.log(`    Adding App: Name='${appName.trim()}', Icon='${iconUrl}', Package='${packageName}'`);
                 appInfos.push({
                    name: appName.trim(),
                    iconUrl: iconUrl,
                    packageName: packageName
                });
                knownPackages.add(packageName);

            }
             // *** END of app finding logic for this array ***


            // Continue traversal *inside* this array's elements
            element.forEach((child, index) => traverse(child, `${path}[${index}]`));

        } else if (typeof element === 'object' && element !== null) {
            // Traverse object values
            Object.keys(element).forEach(key => traverse(element[key], `${path}.${key}`));
        }
        // Primitives (string, number, boolean, null) stop the traversal down that path
    }

    try {
        traverse(jsonElement); // Start traversal
        console.log(`--- App search finished. Checked ${arraysChecked} arrays. Found ${potentialAppsFound} potential apps based on package name. Final count: ${appInfos.length} ---`);
    } catch (error) {
        console.error("Error during app data traversal:", error);
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
        console.log(`Fetching developer apps from proxy: ${DEVELOPER_PAGE_URL}`);
        const response = await fetch(DEVELOPER_PAGE_URL, {
            mode: 'cors',
            signal: AbortSignal.timeout(15000) // 15 second timeout
        });

        const responseText = await response.text(); // Read response text

        if (!response.ok) {
             console.error(`HTTP error ${response.status} fetching apps. Status: ${response.statusText}. Response snippet:`, responseText.substring(0, 500));
             let errorMsg = `Network error: ${response.status} ${response.statusText}.`;
             if (response.status === 403) errorMsg += " Access Forbidden (Proxy Blocked?).";
             else if (response.status === 404) errorMsg += " Not Found.";
             else if (response.status >= 500) errorMsg += " Server error.";
             else errorMsg += " Check URL/Proxy.";
             throw new Error(errorMsg);
         }

        const htmlContent = responseText;
        const jsonData = extractJsonData(htmlContent); // Step 1: Extract
        const apps = searchForApps(jsonData);         // Step 2: Search
        displayAppsInDialog(apps);                     // Step 3: Display

    } catch (error) {
        console.error("ERROR in fetchAndDisplayDeveloperApps:", error);
        if (error.name === 'TimeoutError') {
             showDialogError("Loading apps timed out. Please try again.");
        } else {
             // Pass the specific error message from extractJsonData or searchForApps if available
             showDialogError(error.message || "An unexpected error occurred.");
        }
    }
}


// --- Event Listeners ---

// Drawer
if (menuButton) menuButton.addEventListener('click', openDrawer); else console.error("Menu button missing");
if (closeDrawerButton) closeDrawerButton.addEventListener('click', closeDrawer); else console.error("Close drawer button missing");
if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer); else console.error("Drawer overlay missing");

// Collapsible Sections
toggleSection(moreToggle, moreContent);
toggleSection(appsToggle, appsContent);

// Theme Toggle
if (themeSegmentedButtonSet) {
    themeSegmentedButtonSet.addEventListener('segmented-button-set-selection', (e) => {
        applyTheme(e.detail.button.value);
    });
} else { console.error("Theme button set missing"); }

// Portfolio Dialog
if (viewPortfolioButton && portfolioDialog) {
    viewPortfolioButton.addEventListener('click', fetchAndDisplayDeveloperApps);
} else { console.error("Portfolio button or dialog missing"); }
if (closePortfolioDialogButton && portfolioDialog) {
    closePortfolioDialogButton.addEventListener('click', () => { portfolioDialog.close("closed-by-button"); });
} else { console.error("Portfolio close button or dialog missing"); }

// --- Initial Theme Application ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Applying initial theme on DOMContentLoaded...");
    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme || 'auto'); // Apply saved or default to auto

    // Set initial segmented button state after a short delay
    const currentTheme = savedTheme || 'auto';
    if (themeSegmentedButtonSet) {
        setTimeout(() => {
            try {
                themeSegmentedButtonSet.selected = currentTheme;
                console.log(`Initial segmented button state set to: ${currentTheme}`);
            } catch (err) {
                console.error("Error setting initial segmented button state:", err);
            }
        }, 100); // Increased delay slightly
    }
});

// --- System Theme Change Listener ---
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
const handleSystemThemeChange = (event) => {
    if (!localStorage.getItem('theme')) { // Only if theme is 'auto'
        console.log("System theme changed, re-applying auto theme...");
        applyTheme('auto');
    }
};
try {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
} catch (e) { // Fallback for older browsers
    try { mediaQuery.addListener(handleSystemThemeChange); } catch (e2) { console.error("Error adding theme listener:", e2); }
}

// --- Swipe To Open Drawer Logic ---
let touchStartX = 0;
let touchEndX = 0;
const swipeThreshold = 50;
const edgeThreshold = 40;
let isPotentiallySwiping = false;

console.log("Swipe detection initialized.");

body.addEventListener('touchstart', (e) => {
    const targetElement = e.target;
    if (targetElement.closest('md-dialog') || targetElement.closest('button, a, md-icon-button, md-text-button, md-filled-button, md-outlined-button, md-chip') || targetElement.closest('[data-swipe-ignore]') || window.getComputedStyle(targetElement).overflowY === 'scroll' || targetElement.closest('[style*="overflow: auto"], [style*="overflow-y: scroll"]')) {
        isPotentiallySwiping = false; touchStartX = 0; return;
    }
    const startX = e.touches[0].clientX;
    if (startX < edgeThreshold && !navDrawer.classList.contains('open')) {
        touchStartX = startX; touchEndX = startX; isPotentiallySwiping = true;
    } else { isPotentiallySwiping = false; touchStartX = 0; }
}, { passive: true });

body.addEventListener('touchmove', (e) => {
    if (!isPotentiallySwiping) return;
    touchEndX = e.touches[0].clientX;
}, { passive: true });

body.addEventListener('touchend', (e) => {
    if (!isPotentiallySwiping) return;
    const deltaX = touchEndX - touchStartX;
    if (deltaX > swipeThreshold) {
        const endTarget = document.elementFromPoint(touchEndX, e.changedTouches[0].clientY);
        if (!endTarget || !endTarget.closest('button, a, md-icon-button, md-text-button, md-filled-button, md-outlined-button, md-chip')) {
            console.log(`Swipe detected (deltaX: ${deltaX}), opening drawer.`);
            openDrawer();
        }
    }
    isPotentiallySwiping = false; touchStartX = 0; touchEndX = 0; // Reset
});
// --- End Swipe Logic ---

console.log("Main script execution finished.");