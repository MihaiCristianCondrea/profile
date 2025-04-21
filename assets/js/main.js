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
// --- TRYING A DIFFERENT PROXY ---
// WARNING: Still unreliable. Google might block this too. Serverless function is the proper fix.
const CORS_PROXY_URL = "https://api.allorigins.win/raw?url="; // Try this one (encodes target URL)
// Construct the URL for allorigins
const PLAY_STORE_RAW_URL = `https://play.google.com/store/apps/dev?id=${DEVELOPER_ID}&hl=en&gl=us`;
const DEVELOPER_PAGE_URL = `${CORS_PROXY_URL}${encodeURIComponent(PLAY_STORE_RAW_URL)}`; // URL must be encoded for allorigins

const DEFAULT_ICON_URL = "https://c.clc2l.com/t/g/o/google-playstore-Iauj7q.png";
const PLAY_STORE_APP_URL = "https://play.google.com/store/apps/details?id=";


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

// --- Collapsible Section Logic ---
function toggleSection(toggleButton, contentElement) {
    if (toggleButton && contentElement) {
        toggleButton.addEventListener('click', () => {
            const isExpanded = contentElement.classList.contains('open');
            const icon = toggleButton.querySelector('md-icon[slot="end"] span');

            // Simple accordion: Close other sections if they are open
            if (contentElement.id === 'moreContent' && appsContent.classList.contains('open')) {
                appsContent.classList.remove('open');
                appsToggle.classList.remove('expanded');
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

            // Update expand/collapse icon for the clicked item
            if (icon) {
                icon.textContent = !isExpanded ? 'expand_less' : 'expand_more';
            }
        });
    }
}


// --- Theme Toggle Logic ---
function applyTheme(theme) {
    htmlElement.classList.remove('dark'); // Remove dark first regardless

    if (theme === 'dark') {
        htmlElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if (themeSegmentedButtonSet) themeSegmentedButtonSet.selected = 'dark';
    } else if (theme === 'light') {
        localStorage.setItem('theme', 'light');
        if (themeSegmentedButtonSet) themeSegmentedButtonSet.selected = 'light';
    } else { // Auto theme
        localStorage.removeItem('theme');
        if (themeSegmentedButtonSet) themeSegmentedButtonSet.selected = 'auto';
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            htmlElement.classList.add('dark');
        }
        // No else needed, dark class already removed if system is light
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

function showDialogError(message = "Failed to load apps. Please try again later.") {
     if (dialogContent) {
        dialogContent.innerHTML = `
            <div class="dialog-error">
              <md-icon>error</md-icon> {/* Material Icon name */}
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

    // Sort apps alphabetically before displaying
    apps.sort((a, b) => a.name.localeCompare(b.name));

    apps.forEach(app => {
        const card = createAppCardElement(app);
        grid.appendChild(card);
    });

    dialogContent.appendChild(grid);
}

// --- Functions to mimic Kotlin's scraping (Adapted for JS) ---

function extractJsonData(htmlContent) {
     try {
        // Regex to find the AF_initDataCallback block containing 'ds:3' (or similar key)
         // Made slightly more flexible for key variations like 'ds:5', 'ds:N'
         const dataCallbackRegex = /AF_initDataCallback\s*\(\s*(\{.*?\})\s*\)\s*;/gs;
         let match;
         let relevantJsonString = null;

         // Prioritize AF_initDataCallback
         while ((match = dataCallbackRegex.exec(htmlContent)) !== null) {
             const callbackContent = match[1];
              // Check if this block likely contains the app data key 'ds:N' (e.g., "ds:3", "ds:5")
              // Or common identifiers like 'See more information' which often neighbours app lists.
              if (callbackContent && (callbackContent.match(/['"]ds:\d+['"]/) || callbackContent.includes("See more information"))) {
                 // Regex to extract the 'data' array specifically from this block
                  // This regex might need adjustment based on actual structure. Look for a large array [...]
                  // Try extracting based on known surrounding keys or structure if 'data:' isn't reliable
                  const dataRegex = /data\s*:\s*(\[.*?\])\s*,\s*sideChannel/s; // Looking for an array [...]
                 let dataMatch = callbackContent.match(dataRegex);

                 if (dataMatch && dataMatch[1]) {
                     relevantJsonString = dataMatch[1]; // Extracted the array part
                     break; // Found the relevant block via 'data:' key
                 } else {
                      // Fallback: Try to extract the largest array within the callback block
                      // This is more brittle.
                      const arrayRegex = /(\[.*\])/s; // Find the main array data
                      const arrayMatch = callbackContent.match(arrayRegex);
                      if(arrayMatch && arrayMatch[1] && arrayMatch[1].length > 500) { // Heuristic: look for a large array
                          relevantJsonString = arrayMatch[1];
                          console.warn("Extracted JSON using fallback array regex within AF_initDataCallback");
                          break;
                      }
                  }
             }
         }


         // Fallback if AF_initDataCallback fails: Look for script blocks with IJ_Data or similar patterns
         if (!relevantJsonString) {
            console.warn("AF_initDataCallback method failed, trying script tag regex...");
            // Regex to find script tags containing likely data structures
            // Look for structures containing package names or play store URLs
             const scriptRegex = /<script[^>]*nonce="[^"]+"[^>]*>\s*(.*?)\s*<\/script>/gs; // Added nonce handling
             let scriptMatch;
             while ((scriptMatch = scriptRegex.exec(htmlContent)) !== null) {
                  const scriptContent = scriptMatch[1];
                  // Check for tell-tale signs of app data within the script
                  // Look for common patterns like developer ID, "ds:", or app URLs
                  if (scriptContent && (scriptContent.includes(DEVELOPER_ID) || scriptContent.includes('"ds:')) && scriptContent.includes('https://play-lh.googleusercontent.com') ) {
                       // This script likely contains the data, but extracting the specific part is hard.
                       // Try extracting a large JSON-like object/array assumed to be the main data payload
                       // This often looks like `return [...]` or `var whatever = [...]`
                       const jsonLikeRegex = /return\s+(\[.*\])\s*;\s*\}\)\(\);/s; // Common pattern
                       let potentialJsonMatch = scriptContent.match(jsonLikeRegex);

                       if (potentialJsonMatch && potentialJsonMatch[1]) {
                          relevantJsonString = potentialJsonMatch[1];
                       } else {
                           // Another common pattern: assignment to a variable
                           const assignRegex = /(?:var|const|let)\s+\w+\s*=\s*(\[.*\])\s*;/s;
                           potentialJsonMatch = scriptContent.match(assignRegex);
                           if (potentialJsonMatch && potentialJsonMatch[1]) {
                              relevantJsonString = potentialJsonMatch[1];
                           }
                       }

                       if (relevantJsonString && relevantJsonString.length > 1000) { // Heuristic: large data structure
                           console.warn("Extracted JSON using fallback script tag content regex");
                           break;
                       } else {
                           relevantJsonString = null; // Reset if match wasn't good
                       }
                  }
             }
         }


        if (!relevantJsonString) {
            throw new Error("Failed to extract JSON data structure from HTML using multiple methods.");
        }

        // console.log("Extracted JSON String (raw):", relevantJsonString.substring(0, 500) + "..."); // Debugging

        // Clean potential JS nuances before parsing (e.g., undefined -> null, trailing commas)
        let cleanedJsonString = relevantJsonString
             // Replace escaped chars common in embedded JS strings if necessary
             // .replace(/\\x22/g, '"').replace(/\\x27/g, "'").replace(/\\x3d/g, '=').replace(/\\x26/g, '&') // Example
             .replace(/undefined/g, 'null') // Replace undefined with null
             .replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas before ] or }

        // Parse the extracted string as JSON
        const jsonData = JSON.parse(cleanedJsonString);
        // console.log("Parsed JSON Data:", jsonData); // Debugging
        return jsonData;

    } catch (error) {
        console.error("Error extracting or parsing JSON data:", error);
        // Provide more context if possible
        console.error("Problematic JSON string snippet (cleaned):", cleanedJsonString?.substring(0, 500));
        throw new Error(`Error parsing developer page data: ${error.message}`); // Re-throw for handling
    }
}


function searchForApps(jsonElement) {
     const appInfos = [];
    const knownPackages = new Set();

    // Helper to flatten nested arrays/objects and get all strings
     function flattenStrings(element) {
         let strings = [];
         if (typeof element === 'string') {
             // Only add strings that seem relevant (e.g., avoid very long base64 data)
             if (element.length < 200) {
                 strings.push(element);
             }
         } else if (Array.isArray(element)) {
             element.forEach(item => {
                 strings = strings.concat(flattenStrings(item));
             });
         } else if (typeof element === 'object' && element !== null) {
             // Traverse object values recursively now
             Object.values(element).forEach(value => {
                strings = strings.concat(flattenStrings(value));
             });
         }
         // Filter out obviously irrelevant strings or potential noise
         return strings.filter(s => typeof s === 'string' && s.trim() !== '' && !s.startsWith('data:image'));
     }


    function traverse(element) {
        // Focus on arrays, as Google often structures lists within arrays
        if (Array.isArray(element)) {
            // Heuristic: Check if this array *looks like* it might contain app info
            // Does it contain a 'com.*' string AND an 'https://play-lh.googleusercontent.com' string?
            const strings = flattenStrings(element); // Get strings only within this array subtree
            const packageName = strings.find(s => s && s.startsWith("com.") && !s.includes("google") && s.split('.').length >= 2 && s.length < 100);
            const potentialIcon = strings.find(s => s && s.startsWith("https://play-lh.googleusercontent.com"));

            // If both a potential package name and icon URL are found *within the direct scope* of this array
            if (packageName && potentialIcon && !knownPackages.has(packageName)) {

                 // Find icon URL more reliably (contains =w size param)
                 let iconUrl = strings.find(s => s && s.startsWith("https://play-lh.googleusercontent.com") && s.includes('=') && s.match(/\.(png|jpg|jpeg|webp)/i));
                 iconUrl = iconUrl || potentialIcon || DEFAULT_ICON_URL; // Fallback logic


                 // Find App Name (improved heuristic)
                 // Look for a plausible string near the package name or icon URL in the flattened list
                let appName = strings.find(s =>
                    s &&
                    s !== packageName &&
                    !s.startsWith("http") &&
                    !s.startsWith("com.") && // Ensure it's not another package name
                    s.length > 2 && // Min length
                    s.length < 60 && // Max length
                    !/^\d+(\.\d+)?(M|k|B)?\+?$/.test(s) && // Not just a number or rating/download count (e.g., 4.5, 1M+)
                    !/stars|reviews|downloads|developer/i.test(s) && // Avoid rating/download/dev text
                    s !== "Install" && s !== "Installed" && s !== "Update" && s !== "Free" && // Avoid button/status text
                    !s.includes("Contains ads") && !s.includes("In-app purchases") &&
                    s.match(/[a-zA-Z]/) // Contains at least one letter
                );

                // If the above fails, take the *first* plausible string from the flattened list that meets criteria
                if (!appName) {
                    appName = strings.find(s =>
                        s && s.length > 2 && s.length < 60 && s.match(/[a-zA-Z]/) &&
                        !s.startsWith("http") && !s.startsWith("com.") &&
                         !/^\d+(\.\d+)?(M|k|B)?\+?$/.test(s) &&
                         !/stars|reviews|downloads|developer|install|free|update|contains ads|in-app purchases/i.test(s)
                     );
                }

                appName = appName || packageName; // Fallback to package name if all else fails


                // Final check for validity before adding
                if (packageName && appName && iconUrl) {
                     appInfos.push({
                         name: appName.trim(),
                         iconUrl: iconUrl,
                         packageName: packageName
                     });
                     knownPackages.add(packageName);
                     // console.log(`Found App: ${appName} (${packageName})`); // Debugging
                 }
            }

            // Continue traversal regardless of whether this array itself was an app
            // App data might be nested deeper
            element.forEach(traverse);

        } else if (typeof element === 'object' && element !== null) {
            // Traverse objects too, as data can be nested within them
            Object.values(element).forEach(traverse);
        }
        // Ignore primitives directly here
    }

    traverse(jsonElement);
    return appInfos; // Sorting moved to display function
}


// Main function to fetch and display apps
async function fetchAndDisplayDeveloperApps() {
    if (!portfolioDialog || !dialogContent) {
        console.error("Portfolio dialog or content area not found.");
        return;
    }

    portfolioDialog.show(); // Show dialog immediately with loading state
    showDialogLoading();

    try {
        console.log(`Fetching from proxy: ${DEVELOPER_PAGE_URL}`);
        // Fetch HTML content via CORS proxy
        const response = await fetch(DEVELOPER_PAGE_URL, {
             mode: 'cors', // Explicitly set mode
             // Keep headers minimal for allorigins
             // headers: { }
        });

        const responseText = await response.text(); // Get text first

        if (!response.ok) {
             console.error(`HTTP error ${response.status} from proxy or target URL. Status: ${response.statusText}. Response snippet:`, responseText.substring(0, 500));
             // Try to guess the reason based on status
             let errorMsg = `Network error: ${response.status} ${response.statusText}.`;
             if (response.status === 403) {
                 errorMsg += " Access Forbidden - Google likely blocked the proxy.";
             } else if (response.status === 404) {
                 errorMsg += " Not Found - Check the Play Store URL.";
             } else if (response.status >= 500) {
                 errorMsg += " Server error from proxy or Google.";
             } else {
                  errorMsg += " Check proxy or target URL.";
             }
             throw new Error(errorMsg);
         }

        const htmlContent = responseText;
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
        showDialogError(error.message || "An unexpected error occurred while loading apps."); // Show specific error if available
    }
}


// --- Event Listeners ---

// --- Drawer Listeners ---
if (menuButton) { menuButton.addEventListener('click', openDrawer); }
if (closeDrawerButton) { closeDrawerButton.addEventListener('click', closeDrawer); }
if (drawerOverlay) { drawerOverlay.addEventListener('click', closeDrawer); }

// --- Collapsible Section Listeners ---
toggleSection(moreToggle, moreContent);
toggleSection(appsToggle, appsContent);

// --- Theme Toggle Listener ---
if (themeSegmentedButtonSet) {
     themeSegmentedButtonSet.addEventListener('segmented-button-set-selection', (e) => {
        const selectedValue = e.detail.button.value;
        applyTheme(selectedValue);
        // Optional: closeDrawer();
    });
}

// --- Portfolio Button & Dialog Close Listener ---
if (viewPortfolioButton && portfolioDialog) {
    viewPortfolioButton.addEventListener('click', fetchAndDisplayDeveloperApps);
} else {
     console.error("Could not find View Portfolio button or Dialog element in the DOM.");
}

if (closePortfolioDialogButton && portfolioDialog) {
    closePortfolioDialogButton.addEventListener('click', () => {
        portfolioDialog.close("close-button-clicked"); // Pass optional reason
    });
    // Also listen for the dialog's built-in close event (e.g., clicking outside)
    // portfolioDialog.addEventListener('close', (event) => {
    //    console.log(`Dialog closed with reason: ${event.returnValue}`);
    // });
} else {
     console.error("Could not find Portfolio Dialog Close button or Dialog element in the DOM.");
}


// --- Initial Theme Application ---
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    applyTheme(savedTheme);
} else {
    applyTheme('auto'); // Default to auto
}

// --- System Theme Change Listener ---
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
    // Prevent swipe detection if the touch starts on an interactive element like a button or link
    const targetTagName = e.target.tagName.toLowerCase();
    if (targetTagName === 'button' || targetTagName === 'a' || targetTagName === 'md-icon-button' || targetTagName === 'md-text-button' || targetTagName === 'md-filled-button' || targetTagName === 'md-outlined-button' || targetTagName === 'md-chip' || e.target.closest('md-dialog')) {
        isPotentiallySwiping = false;
        touchStartX = 0;
        // console.log("Swipe ignored: touch started on interactive element or dialog.");
        return;
    }

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
    if (!isPotentiallySwiping) return; // Exit if swipe didn't start near edge or was ignored
    touchEndX = e.touches[0].clientX;
    // console.log(`touchmove: clientX=${touchEndX}`);
}, { passive: true }); // Generally keep move passive

body.addEventListener('touchend', (e) => {
    if (!isPotentiallySwiping) return; // Exit if swipe didn't start near edge or was ignored

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