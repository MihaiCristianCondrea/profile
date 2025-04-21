const menuButton = document.getElementById('menuButton');
const navDrawer = document.getElementById('navDrawer');
const closeDrawerButton = document.getElementById('closeDrawerButton');
const drawerOverlay = document.getElementById('drawerOverlay');
const moreToggle = document.getElementById('moreToggle');
const moreContent = document.getElementById('moreContent');
const appsToggle = document.getElementById('appsToggle');
const appsContent = document.getElementById('appsContent');
const body = document.body; // Get body element for touch events

const viewPortfolioButton = document.querySelector('.profile-card .card-actions md-outlined-button'); // More specific selector
const portfolioDialog = document.getElementById('portfolioDialog');
const dialogContent = document.getElementById('dialogContent');

// --- Constants for App Fetching ---
const DEVELOPER_ID = "5390214922640123642";
// WARNING: Using a public CORS proxy. This might be unreliable or break.
// A backend/serverless function is the robust solution.
const CORS_PROXY_URL = "https://corsproxy.io/?"; // Common proxy
const DEVELOPER_PAGE_URL = `${CORS_PROXY_URL}https://play.google.com/store/apps/dev?id=${DEVELOPER_ID}&hl=en&gl=us`; // Added gl=us for consistency
const DEFAULT_ICON_URL = "https://c.clc2l.com/t/g/o/google-playstore-Iauj7q.png";
const PLAY_STORE_APP_URL = "https://play.google.com/store/apps/details?id=";

function showDialogLoading() {
    if (dialogContent) {
        dialogContent.innerHTML = `
            <div class="dialog-loading">
              <md-circular-progress indeterminate></md-circular-progress>
              <p>Loading apps...</p>
            </div>`;
    }
}

function showDialogError(message = "Failed to load apps. Please try again later.") {
     if (dialogContent) {
        dialogContent.innerHTML = `
            <div class="dialog-error">
              <md-icon>error</md-icon>
              <p>${message}</p>
            </div>`;
    }
}

function createAppCardElement(appInfo) {
    const card = document.createElement('a'); // Use link element
    card.href = `${PLAY_STORE_APP_URL}${appInfo.packageName}`;
    card.target = "_blank"; // Open in new tab
    card.rel = "noopener noreferrer";
    card.className = 'app-card';
    card.title = `${appInfo.name} - ${appInfo.packageName}`; // Tooltip

    const img = document.createElement('img');
    img.src = appInfo.iconUrl || DEFAULT_ICON_URL;
    img.alt = `${appInfo.name} Icon`;
    // Basic error handling for images
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
         showDialogError("No apps found or unable to parse data.");
         return;
    }

    dialogContent.innerHTML = ''; // Clear previous content (loading/error)
    const grid = document.createElement('div');
    grid.className = 'portfolio-grid';

    apps.forEach(app => {
        const card = createAppCardElement(app);
        grid.appendChild(card);
    });

    dialogContent.appendChild(grid);
}

// --- Functions to mimic Kotlin's scraping (Adapted for JS) ---

// Extracts the relevant JSON data embedded in the HTML script
function extractJsonData(htmlContent) {
    try {
        // Regex to find the AF_initDataCallback block containing 'ds:3'
         const dataCallbackRegex = /AF_initDataCallback\s*\((.*?)\);/gs; // global and dotall
         let match;
         let relevantJsonString = null;

         while ((match = dataCallbackRegex.exec(htmlContent)) !== null) {
             const callbackContent = match[1];
             // Check if this block likely contains the app data key 'ds:3'
             if (callbackContent && (callbackContent.includes('"ds:3"') || callbackContent.includes("key: 'ds:3'"))) {
                 // Regex to extract the 'data' array specifically from this block
                  const dataRegex = /data\s*:\s*(\[.*?\})\s*,\s*sideChannel/s; // Simplified slightly, check structure
                 const dataMatch = callbackContent.match(dataRegex);
                 if (dataMatch && dataMatch[1]) {
                     relevantJsonString = dataMatch[1];
                     // Attempt to refine the JSON string - remove potential trailing commas before ']' or '}'
                      relevantJsonString = relevantJsonString.replace(/,\s*([\]}])/g, '$1');
                     break; // Found the relevant block
                 }
             }
         }

        if (!relevantJsonString) {
            console.error("Could not find relevant AF_initDataCallback block or data array.");
            // Fallback: Try a simpler regex for script blocks containing 'ds:3' maybe?
            // This part is brittle and depends heavily on Google's page structure.
            const scriptRegex = /<script[^>]*>.*?window\.IJ_Data\s*=\s*(.*?);<\/script>/gs;
            let scriptMatch;
            while ((scriptMatch = scriptRegex.exec(htmlContent)) !== null) {
                if (scriptMatch[1] && scriptMatch[1].includes('ds:3')) {
                    // This requires more complex parsing of the IJ_Data object
                     console.warn("Found potential data in IJ_Data, but parsing is complex and not fully implemented here.");
                     // Relevant data might be under keys like ds:3 -> [0]
                     // For now, we primarily rely on the AF_initDataCallback method.
                     break;
                 }
             }

            if (!relevantJsonString) throw new Error("Failed to extract JSON data structure from HTML.");
        }

        // console.log("Extracted JSON String (raw):", relevantJsonString); // Debugging

        // Clean potential JS nuances before parsing (e.g., undefined -> null)
        // Be careful with overly broad replacements
        let cleanedJsonString = relevantJsonString;
         // cleanedJsonString = cleanedJsonString.replace(/undefined/g, 'null'); // Use cautiously

        // Parse the extracted string as JSON
        const jsonData = JSON.parse(cleanedJsonString);
        // console.log("Parsed JSON Data:", jsonData); // Debugging
        return jsonData;

    } catch (error) {
        console.error("Error extracting or parsing JSON data:", error);
        console.error("Problematic JSON string snippet:", relevantJsonString?.substring(0, 500)); // Log part of the string
        throw new Error("Error parsing developer page data."); // Re-throw for handling
    }
}


// Recursively searches the JSON structure for app information
function searchForApps(jsonElement) {
    const appInfos = [];
    const knownPackages = new Set();

    // Helper to flatten nested arrays and get strings - less strict than Kotlin version
     function flattenStrings(element) {
         let strings = [];
         if (typeof element === 'string') {
             strings.push(element);
         } else if (Array.isArray(element)) {
             element.forEach(item => {
                 strings = strings.concat(flattenStrings(item));
             });
         } else if (typeof element === 'object' && element !== null) {
             // Only go one level deep into objects for simplicity here
             Object.values(element).forEach(value => {
                  if (typeof value === 'string') {
                     strings.push(value);
                  }
             });
         }
         return strings;
     }


    function traverse(element) {
        if (Array.isArray(element)) {
            // --- Heuristic Logic (adaptation of Kotlin) ---
            // Check if this array *might* represent an app
            const strings = flattenStrings(element); // Get all strings within this array subtree
            const packageName = strings.find(s => s && s.startsWith("com.") && !s.includes("google") && s.split('.').length >= 2); // Basic package name check

            if (packageName && !knownPackages.has(packageName)) {
                 // Find icon URL (likely starts with https, ends with image extension or parameters)
                 let iconUrl = strings.find(s => s && s.startsWith("https://") && (s.includes('=') || s.match(/\.(png|jpg|jpeg|webp)/i)));
                if (!iconUrl) {
                    // More specific search within nested arrays if the top level fails
                    element.forEach(subEl => {
                        if (Array.isArray(subEl)) {
                           const subStrings = flattenStrings(subEl);
                           const foundIcon = subStrings.find(s => s && s.startsWith("https://") && (s.includes('=') || s.match(/\.(png|jpg|jpeg|webp)/i)));
                           if(foundIcon) iconUrl = foundIcon;
                        }
                    });
                }
                iconUrl = iconUrl || DEFAULT_ICON_URL; // Fallback icon


                 // Find App Name (heuristic)
                let appName = null;
                // Try specific indices like in Kotlin (adjust indices based on inspection if needed)
                 if (typeof element[2] === 'string' && element[2].length < 60 && element[2] !== packageName && !element[2].startsWith("http")) {
                      appName = element[2];
                 }
                 // Look for other potential strings that aren't the package or URL
                 if (!appName) {
                     appName = strings.find(s =>
                         s &&
                         s !== packageName &&
                         !s.startsWith("https://") &&
                         s.length > 2 && // Min length
                         s.length < 60 && // Max length
                         !s.match(/^\d+(\.\d+)?$/) && // Not just a number (e.g., rating)
                         s !== "Install" && // Avoid button text
                         s !== "Free" &&
                         !s.includes("Contains ads") &&
                         !s.includes("In-app purchases") &&
                         s.match(/[a-zA-Z]/) // Contains at least one letter
                      );
                 }
                appName = appName || packageName; // Fallback to package name


                appInfos.push({
                    name: appName.trim(),
                    iconUrl: iconUrl,
                    packageName: packageName
                });
                knownPackages.add(packageName);
                // console.log(`Found App: ${appName} (${packageName})`); // Debugging
            }

            // Continue traversal
            element.forEach(traverse);

        } else if (typeof element === 'object' && element !== null) {
            Object.values(element).forEach(traverse);
        }
        // Ignore primitives directly here
    }

    traverse(jsonElement);
    // Sort apps alphabetically by name
     return appInfos.sort((a, b) => a.name.localeCompare(b.name));
}


// Main function to fetch and display apps
async function fetchAndDisplayDeveloperApps() {
    if (!portfolioDialog || !dialogContent) return;

    portfolioDialog.show(); // Show dialog immediately with loading state
    showDialogLoading();

    try {
        // Fetch HTML content via CORS proxy
        const response = await fetch(DEVELOPER_PAGE_URL, {
            headers: {
                // Pretend to be a regular browser
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36', // Update Chrome version periodically
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        if (!response.ok) {
             // Attempt to read error from proxy if possible
             let proxyError = '';
             try { proxyError = await response.text(); } catch (_) {}
             console.error(`HTTP error ${response.status} from proxy or target URL.`, proxyError);
             throw new Error(`Network error: ${response.status} ${response.statusText}. Check CORS proxy?`);
         }

        const htmlContent = await response.text();
        // console.log("Fetched HTML (snippet):", htmlContent.substring(0, 1000)); // Debugging

        // Extract the embedded JSON data
        const jsonData = extractJsonData(htmlContent);

        // Search the JSON for app information
        const apps = searchForApps(jsonData);
         // console.log("Processed Apps:", apps); // Debugging

        // Display the apps in the dialog
        displayAppsInDialog(apps);

    } catch (error) {
        console.error("Failed to fetch or process developer apps:", error);
        showDialogError(error.message || "An unexpected error occurred."); // Show specific error if available
    }
}

// --- NEW: Portfolio Button Listener ---
if (viewPortfolioButton && portfolioDialog) {
    viewPortfolioButton.addEventListener('click', () => {
        fetchAndDisplayDeveloperApps();
    });
} else {
     console.error("Could not find View Portfolio button or Dialog element.");
}

// --- Drawer Logic ---
function openDrawer() {
    if (navDrawer && drawerOverlay) {
        navDrawer.classList.add('open');
        drawerOverlay.classList.add('open');
        body.style.overflow = 'hidden'; // Prevent background scrolling when drawer is open
    }
}

function closeDrawer() {
    if (navDrawer && drawerOverlay) {
        navDrawer.classList.remove('open');
        drawerOverlay.classList.remove('open');
        body.style.overflow = ''; // Restore background scrolling
    }
}

if (menuButton) {
    menuButton.addEventListener('click', openDrawer);
}
if (closeDrawerButton) {
    closeDrawerButton.addEventListener('click', closeDrawer);
}
if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
}

// --- Collapsible Section Logic ---
function toggleSection(toggleButton, contentElement) {
    if (toggleButton && contentElement) {
        toggleButton.addEventListener('click', () => {
            const isExpanded = contentElement.classList.contains('open');
            // Close other section if open (simple accordion)
            // You might want more complex logic if multiple can be open
            if (contentElement.id === 'moreContent' && appsContent.classList.contains('open')) {
                appsContent.classList.remove('open');
                appsToggle.classList.remove('expanded');
                // Update icon rotation if necessary (MDC might handle this automatically)
                const appsIcon = appsToggle.querySelector('md-icon[slot="end"] span');
                 if (appsIcon) appsIcon.textContent = 'expand_more';
            } else if (contentElement.id === 'appsContent' && moreContent.classList.contains('open')) {
                moreContent.classList.remove('open');
                moreToggle.classList.remove('expanded');
                const moreIcon = moreToggle.querySelector('md-icon[slot="end"] span');
                if (moreIcon) moreIcon.textContent = 'expand_more';
            }

            // Toggle current section
            contentElement.classList.toggle('open', !isExpanded);
            toggleButton.classList.toggle('expanded', !isExpanded);

            // Update expand/collapse icon
            const icon = toggleButton.querySelector('md-icon[slot="end"] span');
            if (icon) {
                icon.textContent = !isExpanded ? 'expand_less' : 'expand_more';
            }
        });
    }
}
toggleSection(moreToggle, moreContent);
toggleSection(appsToggle, appsContent);


// --- Theme Toggle Logic ---
const lightThemeButton = document.getElementById('lightThemeButton');
const darkThemeButton = document.getElementById('darkThemeButton');
const autoThemeButton = document.getElementById('autoThemeButton');
const themeSegmentedButtonSet = document.getElementById('themeSegmentedButtonSet');
const htmlElement = document.documentElement;

function applyTheme(theme) {
    htmlElement.classList.remove('dark'); // Remove dark first regardless

    if (theme === 'dark') {
        htmlElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if(themeSegmentedButtonSet) themeSegmentedButtonSet.selected = 'dark'; // Update segmented button UI
    } else if (theme === 'light') {
        // No class needed for light, just ensure dark is removed
        localStorage.setItem('theme', 'light');
         if(themeSegmentedButtonSet) themeSegmentedButtonSet.selected = 'light'; // Update segmented button UI
    } else { // Auto theme
        localStorage.removeItem('theme');
         if(themeSegmentedButtonSet) themeSegmentedButtonSet.selected = 'auto'; // Update segmented button UI
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            htmlElement.classList.add('dark');
        }
        // No else needed, dark class already removed
    }
}

// Event listeners for theme buttons (using the set for delegation)
if (themeSegmentedButtonSet) {
     themeSegmentedButtonSet.addEventListener('segmented-button-set-selection', (e) => {
        // detail.button is the md-segmented-button element that was selected
        const selectedValue = e.detail.button.value;
        applyTheme(selectedValue);
        // Optional: Close drawer after selection
        // closeDrawer();
    });
}


// Apply saved theme or auto theme on initial load
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    applyTheme(savedTheme);
} else {
    applyTheme('auto'); // Default to auto
}

// Listen for system theme changes if in auto mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (!localStorage.getItem('theme')) { // Only apply if theme is 'auto'
        if (event.matches) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
    }
});

// --- Swipe To Open Drawer Logic ---
let touchStartX = 0;
let touchEndX = 0;
const swipeThreshold = 50; // Minimum pixels swiped horizontally to trigger open
const edgeThreshold = 40; // Max distance from left edge to start swipe (pixels)
let isPotentiallySwiping = false; // Flag to track if a valid swipe started

console.log("Swipe detection initialized."); // Check if script runs

body.addEventListener('touchstart', (e) => {
    // Only listen if the touch starts near the left edge and drawer isn't already open
    const startX = e.touches[0].clientX;
    // console.log(`touchstart: clientX=${startX}`); // Log start position
    if (startX < edgeThreshold && !navDrawer.classList.contains('open')) {
        // console.log('touchstart: Near edge and drawer closed.');
        touchStartX = startX;
        touchEndX = touchStartX; // Initialize endX
        isPotentiallySwiping = true; // Mark potential swipe start
    } else {
        isPotentiallySwiping = false; // Reset if touch starts elsewhere or drawer is open
        touchStartX = 0; // Ensure reset
    }
}, { passive: true }); // Use passive for better scroll performance initially

body.addEventListener('touchmove', (e) => {
    if (!isPotentiallySwiping) return; // Exit if swipe didn't start near edge

    touchEndX = e.touches[0].clientX;
    // console.log(`touchmove: clientX=${touchEndX}`); // Log move position

    // Optional: Prevent default scroll if horizontal movement is dominant
    // Be cautious with this, might block necessary vertical scrolling
    // const deltaX = touchEndX - touchStartX;
    // const startY = e.touches[0].clientY; // Need to record startY in touchstart
    // const deltaY = Math.abs(e.touches[0].clientY - startY);
    // if (Math.abs(deltaX) > deltaY + 10) { // Heuristic: more horizontal than vertical
    //    // console.log("Preventing scroll due to horizontal swipe");
    //    // e.preventDefault(); // <-- If you uncomment this, remove passive: true from touchmove!
    // }

}, { passive: true }); // Keep passive unless you uncomment preventDefault above

body.addEventListener('touchend', (e) => {
    if (!isPotentiallySwiping) return; // Exit if swipe didn't start near edge

    const deltaX = touchEndX - touchStartX;
    // console.log(`touchend: deltaX=${deltaX}`); // Log final difference

    if (deltaX > swipeThreshold) {
        console.log(`Swipe detected (deltaX: ${deltaX}), opening drawer.`);
        openDrawer();
    } else {
        // console.log(`Swipe below threshold (deltaX: ${deltaX}).`);
    }

    // Reset flags and coordinates regardless of outcome
    isPotentiallySwiping = false;
    touchStartX = 0;
    touchEndX = 0;
});

// --- End Swipe Logic ---