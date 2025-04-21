console.log("SCRIPT START: main.js executing");
console.log("SCRIPT: Getting element references...");
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
const viewPortfolioButton = document.getElementById('viewPortfolioButton');
const portfolioDialog = document.getElementById('portfolioDialog');
const dialogContent = document.getElementById('dialogContent');
const closePortfolioDialogButton = document.getElementById('closePortfolioDialogButton');
console.log("SCRIPT: Element references obtained.");
console.log("SCRIPT: Defining constants...");
const DEVELOPER_ID = "5390214922640123642"; // Make sure this is your correct ID
// WARNING: Public CORS proxies like allorigins.win are unreliable for production.
// Consider creating your own server-side proxy for fetching the Play Store page.
const CORS_PROXY_URL = "https://api.allorigins.win/get?url=";
const PLAY_STORE_RAW_URL = `https://play.google.com/store/apps/dev?id=${DEVELOPER_ID}&hl=en&gl=us`;
const DEVELOPER_PAGE_URL = `${CORS_PROXY_URL}${encodeURIComponent(PLAY_STORE_RAW_URL)}`;
const DEFAULT_ICON_URL = "https://c.clc2l.com/t/g/o/google-playstore-Iauj7q.png"; // Or use a local placeholder
const PLAY_STORE_APP_URL = "https://play.google.com/store/apps/details?id=";
const FETCH_TIMEOUT_MS = 20000; // 20 seconds
console.log("SCRIPT: Constants defined. DEVELOPER_PAGE_URL:", DEVELOPER_PAGE_URL);

// --- Drawer Functions ---
function openDrawer() {
  console.log("FUNC openDrawer: Called");
  if (navDrawer && drawerOverlay) {
    navDrawer.classList.add('open');
    drawerOverlay.classList.add('open');
    body.style.overflow = 'hidden';
    console.log("FUNC openDrawer: Drawer opened, overflow hidden");
  } else {
    console.error("FUNC openDrawer: Drawer or overlay element not found!");
  }
}

function closeDrawer() {
  console.log("FUNC closeDrawer: Called");
  if (navDrawer && drawerOverlay) {
    navDrawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
    body.style.overflow = '';
    console.log("FUNC closeDrawer: Drawer closed, overflow restored");
  } else {
    console.error("FUNC closeDrawer: Drawer or overlay element not found!");
  }
}

// --- Section Toggle ---
function toggleSection(toggleButton, contentElement) {
  const functionName = `FUNC toggleSection (Button ID: ${toggleButton?.id}, Content ID: ${contentElement?.id})`;
  console.log(`${functionName}: Setting up listener`);
  if (!toggleButton || !contentElement) {
    console.error(`${functionName}: Button or content element missing`);
    return;
  }
  toggleButton.addEventListener('click', () => {
    console.log(`${functionName}: Clicked`);
    const isExpanded = contentElement.classList.contains('open');
    console.log(`${functionName}: Currently expanded? ${isExpanded}`);
    // Close other section if open
    if (contentElement.id === 'moreContent' && appsContent?.classList.contains('open')) {
      console.log(`${functionName}: Closing 'appsContent'`);
      appsContent.classList.remove('open');
      appsToggle?.classList.remove('expanded');
    } else if (contentElement.id === 'appsContent' && moreContent?.classList.contains('open')) {
      console.log(`${functionName}: Closing 'moreContent'`);
      moreContent.classList.remove('open');
      moreToggle?.classList.remove('expanded');
    }
    // Toggle current section
    contentElement.classList.toggle('open', !isExpanded);
    toggleButton.classList.toggle('expanded', !isExpanded);
    console.log(`${functionName}: Toggled. Now expanded? ${!isExpanded}`);
  });
}

// --- Theme Handling ---
function applyTheme(theme) {
  console.log(`FUNC applyTheme: Called with theme='${theme}'`);
  htmlElement.classList.remove('dark'); // Always remove first
  let finalTheme = theme;
  let themeSource = "Argument";

  if (theme === 'dark') {
    htmlElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else if (theme === 'light') {
    localStorage.setItem('theme', 'light');
  } else { // 'auto' or invalid/null
    finalTheme = 'auto';
    themeSource = "Auto";
    localStorage.removeItem('theme'); // Ensure explicit removal for auto
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      htmlElement.classList.add('dark');
      themeSource = "Auto (System Dark)";
    } else {
      themeSource = "Auto (System Light)";
    }
  }

  console.log(`FUNC applyTheme: ${themeSource} theme applied. localStorage['theme']='${localStorage.getItem('theme') || 'auto'}'. Dark class present? ${htmlElement.classList.contains('dark')}`);

  // Update the segmented button UI
  if (themeSegmentedButtonSet) {
    try {
      // Defer UI update slightly to ensure component is ready
      // setTimeout(() => {
      themeSegmentedButtonSet.selected = finalTheme;
      console.log(`FUNC applyTheme: Set segmented button selected value to '${finalTheme}'`);
      // }, 0);
    } catch (err) {
      console.error("FUNC applyTheme: Error setting themeSegmentedButtonSet.selected:", err);
    }
  } else {
    console.warn("FUNC applyTheme: themeSegmentedButtonSet not found, cannot update UI.");
  }
}

// --- Portfolio Dialog States ---
function showDialogLoading() {
  console.log("FUNC showDialogLoading: Displaying loading state.");
  if (dialogContent) {
    dialogContent.innerHTML = `
            <div class="dialog-loading">
              <md-circular-progress indeterminate aria-label="Loading apps"></md-circular-progress>
              <p>Loading apps...</p>
            </div>`;
  } else {
    console.error("FUNC showDialogLoading: dialogContent element not found!");
  }
}

function showDialogError(message = "Failed to load apps.") {
  console.log(`FUNC showDialogError: Called with message: "${message}"`);
  if (dialogContent) {
    let fullMessage = message;
    // Add more context to common errors
    if (message.toLowerCase().includes("fetch")) {
      fullMessage += " (Network issue or CORS proxy problem. The public proxy might be blocked or down. Using a dedicated server-side proxy is recommended.)";
    } else if (message.toLowerCase().includes("timeout")) {
      fullMessage += " (The request took too long.)";
    } else if (message.toLowerCase().includes("parsing") || message.toLowerCase().includes("extract") || message.toLowerCase().includes("structure")) {
      fullMessage += " (Could not read data from the page. Website layout may have changed.)";
    } else if (message.toLowerCase().includes("network error")) {
      fullMessage += " (Could not reach the data source.)";
    }
    console.error("FUNC showDialogError: Displaying error message:", fullMessage);
    dialogContent.innerHTML = `
            <div class="dialog-error">
              <md-icon>warning</md-icon>
              <p>${fullMessage}</p>
            </div>`;
  } else {
    console.error("FUNC showDialogError: dialogContent element not found!");
  }
}

// --- App Card Creation ---
function createAppCardElement(appInfo) {
  // console.log(`FUNC createAppCardElement: Creating card for ${appInfo.packageName}`); // Can be verbose
  if (!appInfo || !appInfo.packageName || !appInfo.name) {
    console.warn("FUNC createAppCardElement: Invalid appInfo received", appInfo);
    return null; // Don't create a card for invalid data
  }
  const card = document.createElement('a');
  card.href = `${PLAY_STORE_APP_URL}${appInfo.packageName}`;
  card.target = "_blank"; // Open in new tab
  card.rel = "noopener noreferrer"; // Security measure
  card.className = 'app-card'; // Apply your CSS class
  card.title = `${appInfo.name} - ${appInfo.packageName}`; // Tooltip

  const img = document.createElement('img');
  // Ensure the icon URL is valid, fallback if not
  img.src = (appInfo.iconUrl && appInfo.iconUrl.startsWith('https://')) ? appInfo.iconUrl : DEFAULT_ICON_URL;
  img.alt = `${appInfo.name} Icon`;
  img.loading = "lazy"; // Improve performance
  img.onerror = () => { // Fallback if image fails to load
    console.warn(`FUNC createAppCardElement: Image failed to load for ${appInfo.packageName}, using default.`);
    img.src = DEFAULT_ICON_URL;
    img.onerror = null; // Prevent infinite loops if default icon also fails
  };

  const name = document.createElement('p');
  name.textContent = appInfo.name;

  card.appendChild(img);
  card.appendChild(name);
  // console.log(`FUNC createAppCardElement: Card created successfully for ${appInfo.packageName}`);
  return card;
}

// --- Display Apps in Dialog ---
function displayAppsInDialog(apps) {
  console.log("FUNC displayAppsInDialog: Called.");
  if (!dialogContent) {
    console.error("FUNC displayAppsInDialog: dialogContent element not found!");
    return;
  }

  if (!apps || !Array.isArray(apps)) {
    console.error("FUNC displayAppsInDialog: Invalid apps data received:", apps);
    showDialogError("Received invalid app data.");
    return;
  }

  if (apps.length === 0) {
    console.warn("FUNC displayAppsInDialog: No apps found to display.");
    showDialogError("No apps found for this developer."); // More specific message
    return;
  }

  console.log(`FUNC displayAppsInDialog: Preparing to display ${apps.length} apps.`);
  dialogContent.innerHTML = ''; // Clear previous content (loading/error)
  const grid = document.createElement('div');
  grid.className = 'portfolio-grid'; // Your grid container class

  let cardsAdded = 0;
  apps.forEach(app => {
    try {
      const card = createAppCardElement(app);
      if (card) { // Only append if card creation was successful
        grid.appendChild(card);
        cardsAdded++;
      }
    } catch (error) {
      console.error(`FUNC displayAppsInDialog: Error creating card for app:`, app, error);
      // Decide if you want to show an error or just skip the card
    }
  });

  if (cardsAdded > 0) {
    dialogContent.appendChild(grid);
    console.log(`FUNC displayAppsInDialog: Grid with ${cardsAdded} app cards appended.`);
  } else {
    console.warn("FUNC displayAppsInDialog: No valid app cards could be created.");
    showDialogError("Could not create display cards for the found apps.");
  }
}


// --- Data Extraction and Parsing (Revised) ---

function extractJsonData(htmlContent) {
  console.log("FUNC extractJsonData: Starting extraction...");
  if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.length < 500) { // Basic sanity check
    console.error("FUNC extractJsonData: Input htmlContent is invalid or too short.");
    throw new Error("Invalid HTML content received for extraction.");
  }
  console.log(`FUNC extractJsonData: Processing HTML content (Length: ${htmlContent.length})`);

  try {
    // Method 1: Prioritize AF_initDataCallback (similar to Kotlin)
    console.log("FUNC extractJsonData: Attempting Method 1 (AF_initDataCallback)...");
    const dataCallbackRegex = /AF_initDataCallback\s*\(\s*(\{.*?\})\s*\)\s*;/gs;
    let match;
    let relevantJsonString = null;
    let foundKey = null;

    while ((match = dataCallbackRegex.exec(htmlContent)) !== null) {
      const callbackContent = match[1];
      // Look for keys commonly associated with app lists (ds:3, ds:5 etc. - these can change!)
      if (callbackContent && /['"]ds:\d+['"]/.test(callbackContent)) {
        console.log("FUNC extractJsonData: Found AF_initDataCallback block with a 'ds:' key.");
        // Try to extract the 'data' array specifically
        const dataMatch = callbackContent.match(/,\s*key:\s*['"](ds:\d+)['"]\s*,\s*hash:\s*['"][^'"]+['"]\s*,\s*data:\s*(\[.*?\])\s*,\s*sideChannel/s);
        if (dataMatch && dataMatch[1] && dataMatch[2]) {
          foundKey = dataMatch[1];
          relevantJsonString = dataMatch[2];
          console.log(`FUNC extractJsonData: Extracted 'data' array associated with key '${foundKey}'.`);
          break; // Found the primary target
        } else {
          console.log(`FUNC extractJsonData: Could not find specific 'key/data' structure in this callback block, will keep searching.`);
        }
      }
    }

    // Fallback: If the specific structure wasn't found, maybe the structure changed slightly
    if (!relevantJsonString) {
      console.log("FUNC extractJsonData: Specific key/data structure not found, trying broader search within AF_initDataCallback...");
      dataCallbackRegex.lastIndex = 0; // Reset regex index
      while ((match = dataCallbackRegex.exec(htmlContent)) !== null) {
        const callbackContent = match[1];
        if (callbackContent && /['"]ds:\d+['"]/.test(callbackContent)) {
          // Look for *any* large array within this callback block
          const genericArrayMatch = callbackContent.match(/:\s*(\[.*\])/s); // Less specific
          if (genericArrayMatch && genericArrayMatch[1] && genericArrayMatch[1].length > 1000) { // Check length as heuristic
            relevantJsonString = genericArrayMatch[1];
            console.log(`FUNC extractJsonData: Found a large array within an AF_initDataCallback block (fallback).`);
            break;
          }
        }
      }
    }

    // Method 2: Script Tag Fallback (Less reliable, keep as last resort)
    //   if (!relevantJsonString) {
    //       console.warn("FUNC extractJsonData: AF_initDataCallback methods failed, attempting Script Tag Fallback (less reliable)...");
    //       // ... (Your existing script tag regex logic could go here if needed) ...
    //       // However, focusing on AF_initDataCallback is usually better.
    //   }

    if (!relevantJsonString) {
      console.error("FUNC extractJsonData: Failed to find relevant JSON data structure in the HTML.");
      throw new Error("Failed to extract JSON data structure from HTML.");
    }

    console.log(`FUNC extractJsonData: Extraction successful. String length: ${relevantJsonString.length}. Preparing to parse...`);

    // Clean the JSON string (handle potential issues)
    let cleanedJsonString = relevantJsonString
      // .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))) // Handle hex escapes if necessary
      .replace(/undefined/g, 'null') // Replace undefined with null
      .replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas

    console.log("FUNC extractJsonData: Parsing cleaned JSON string...");
    const jsonData = JSON.parse(cleanedJsonString);
    console.log("FUNC extractJsonData: JSON parsing successful.");
    return jsonData; // Should be the array containing app data

  } catch (error) {
    console.error(`FUNC extractJsonData: Error during extraction or parsing:`, error);
    // Improve error message based on type
    if (error instanceof SyntaxError) {
      throw new Error(`Error parsing extracted data: ${error.message}. The data format might have changed.`);
    } else {
      throw new Error(`Error during data extraction: ${error.message}`);
    }
  }
}

function searchForApps(dataArray) {
  console.log("FUNC searchForApps: Starting app search...");
  const appInfos = [];
  const knownPackages = new Set();

  if (!Array.isArray(dataArray)) {
    console.error("FUNC searchForApps: Expected an array, but received:", typeof dataArray);
    throw new Error("Invalid data format: Expected an array for app search.");
  }

  console.log(`FUNC searchForApps: Received data array with ${dataArray.length} potential top-level items.`);

  // Helper function to recursively find strings within any element
  function flattenStrings(element) {
    if (typeof element === 'string') {
      return [element];
    } else if (Array.isArray(element)) {
      return element.flatMap(flattenStrings); // Recursively flatten arrays
    } else if (element && typeof element === 'object') {
      // For objects, flatten values (keys are usually not needed here)
      return Object.values(element).flatMap(flattenStrings);
    }
    return []; // Return empty array for null, numbers, booleans etc.
  }

  // Recursive traversal function optimized for the expected structure
  function traverse(element) {
    if (Array.isArray(element)) {
      // Heuristic: Check if this array looks like an app entry
      // It often contains multiple strings, including a package name and URLs.
      const strings = flattenStrings(element); // Get all strings within this array and its children
      const packageName = strings.find(s => s && s.startsWith('com.') && !s.includes('google') && s.split('.').length >= 2); // Find potential package name

      if (packageName && !knownPackages.has(packageName)) {
        // console.log(`FUNC searchForApps: Potential package found: ${packageName}`); // Verbose log
        // Find icon URL (usually starts with https://play-lh.googleusercontent.com/)
        const iconUrl = strings.find(s => s && s.startsWith('https://play-lh.googleusercontent.com/'));
        // Find app name - often a direct string element in the array, or the most prominent non-URL, non-package string
        let appName = null;
        // Try specific indices known from past structures (e.g., index 2 or 3)
        if (typeof element[2] === 'string' && element[2].length > 1 && element[2].length < 100) appName = element[2];
        else if (typeof element[3] === 'string' && element[3].length > 1 && element[3].length < 100) appName = element[3];

        // Fallback: Find the first reasonable string that isn't the package or URL
        if (!appName) {
          appName = strings.find(s => s && s !== packageName && !s.startsWith('https://') && s.length > 1 && s.length < 100 && !/^\d+(\.\d+)?$/.test(s) /* not just numbers */ );
        }
        // Final fallback: use package name if no other name found
        appName = appName || packageName;

        // Clean up potential HTML entities in name
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = appName;
        appName = tempDiv.textContent || tempDiv.innerText || appName;


        // console.log(`FUNC searchForApps: Adding App: Name='${appName}', Icon='${iconUrl || 'Default'}', Package='${packageName}'`);
        appInfos.push({
          name: appName.trim(), // Trim whitespace
          iconUrl: iconUrl || DEFAULT_ICON_URL, // Use default if not found
          packageName: packageName
        });
        knownPackages.add(packageName); // Mark package as processed
      } else {
        // If it doesn't look like an app entry itself, traverse its children
        element.forEach(traverse);
      }
    } else if (element && typeof element === 'object') {
      // Traverse object values if needed, though the primary structure is usually array-based
      Object.values(element).forEach(traverse);
    }
  }

  // Start traversal from the root array provided
  dataArray.forEach(traverse);

  console.log(`FUNC searchForApps: Found ${appInfos.length} unique apps.`);
  if (appInfos.length === 0) {
    console.warn("FUNC searchForApps: No apps could be extracted from the provided data structure. The structure might have changed significantly.");
  }
  return appInfos.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
}


// --- Main Fetch and Display Logic ---
async function fetchAndDisplayDeveloperApps() {
  const functionName = "FUNC fetchAndDisplayDeveloperApps";
  console.log(`${functionName}: Starting...`);

  if (!portfolioDialog || !dialogContent) {
    console.error(`${functionName}: Portfolio dialog or content area element not found.`);
    return;
  }

  try {
    portfolioDialog.show(); // Show the dialog immediately
    console.log(`${functionName}: Dialog shown.`);
    showDialogLoading(); // Show loading state

    console.log(`${functionName}: Fetching from URL: ${DEVELOPER_PAGE_URL}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(DEVELOPER_PAGE_URL, {
      signal: controller.signal,
      headers: { // Attempt to mimic browser headers (might help slightly)
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    clearTimeout(timeoutId); // Clear the timeout if fetch completes

    if (!response.ok) {
      // Throw specific errors based on status code
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    console.log(`${functionName}: Fetch successful. Parsing proxy response JSON...`);
    // allorigins wraps the content in JSON: { contents: "<html>...", status: {...} }
    const proxyJson = await response.json();

    if (!proxyJson || !proxyJson.contents) {
      throw new Error("Invalid response from CORS proxy: 'contents' field missing.");
    }

    const htmlContent = proxyJson.contents;
    console.log(`${functionName}: HTML content received (Length: ${htmlContent.length}). Extracting data...`);

    // Extract the specific JSON data structure from the HTML
    const jsonData = extractJsonData(htmlContent); // Should return the target array

    console.log(`${functionName}: Data extracted. Searching for apps within the data...`);
    const apps = searchForApps(jsonData); // Pass the extracted array

    console.log(`${functionName}: App search complete. Displaying apps...`);
    displayAppsInDialog(apps);

    console.log(`${functionName}: Process completed successfully.`);

  } catch (error) {
    console.error(`${functionName}: CATCH BLOCK - Error occurred:`, error);
    let displayError = error.message;
    // Customize error message for timeout
    if (error.name === 'AbortError') {
      displayError = `Loading apps timed out after ${FETCH_TIMEOUT_MS / 1000} seconds.`;
    }
    showDialogError(displayError); // Display the error in the dialog
  } finally {
    console.log(`${functionName}: --- Finished ---`);
    // Optional: Hide loading indicator if it wasn't replaced by content/error
  }
}


// --- Event Listeners Setup ---
console.log("SCRIPT: Setting up event listeners...");

// Drawer listeners
if (menuButton) menuButton.addEventListener('click', openDrawer);
else console.error("SCRIPT ERROR: Menu button missing");

if (closeDrawerButton) closeDrawerButton.addEventListener('click', closeDrawer);
else console.error("SCRIPT ERROR: Close drawer button missing");

if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
else console.error("SCRIPT ERROR: Drawer overlay missing");

// Section toggles
toggleSection(moreToggle, moreContent);
toggleSection(appsToggle, appsContent);

// Theme listener
if (themeSegmentedButtonSet) {
  themeSegmentedButtonSet.addEventListener('segmented-button-set-selection', e => {
    console.log("EVENT: themeSegmentedButtonSet selection changed to:", e.detail?.button?.value);
    // Check if detail and button exist before accessing value
    if (e.detail?.button?.value) {
      applyTheme(e.detail.button.value);
    } else {
      console.warn("EVENT: themeSegmentedButtonSet selection event structure unexpected.", e.detail);
    }
  });
  console.log("SCRIPT: Theme toggle listener added.");
} else {
  console.error("SCRIPT ERROR: Theme button set missing");
}

// Portfolio button listener
if (viewPortfolioButton && portfolioDialog) {
  viewPortfolioButton.addEventListener('click', () => {
    console.log("EVENT: viewPortfolioButton clicked");
    // Check if dialog is already open (optional, prevents multiple fetches)
    if (portfolioDialog.open) {
      console.log("EVENT: Portfolio dialog already open, not re-fetching.");
      return;
    }
    fetchAndDisplayDeveloperApps(); // Fetch and display when clicked
  });
  console.log("SCRIPT: Portfolio button listener added.");
} else {
  console.error("SCRIPT ERROR: Portfolio button or dialog missing");
}

// Portfolio close button listener
if (closePortfolioDialogButton && portfolioDialog) {
  closePortfolioDialogButton.addEventListener('click', () => {
    console.log("EVENT: closePortfolioDialogButton clicked");
    portfolioDialog.close("closed-by-button"); // Close the dialog
  });
  console.log("SCRIPT: Portfolio close button listener added.");
} else {
  console.error("SCRIPT ERROR: Portfolio close button or dialog missing");
}


// --- Initialization ---

// Apply initial theme on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("EVENT: DOMContentLoaded - Applying initial theme...");
  const savedTheme = localStorage.getItem('theme');
  console.log(`EVENT: DOMContentLoaded - Saved theme from localStorage: '${savedTheme}'`);
  const initialTheme = savedTheme || 'auto';
  applyTheme(initialTheme); // Apply theme immediately

  // Set the initial state of the segmented button
  // Needs a slight delay for Material Web Components to initialize fully
  if (themeSegmentedButtonSet) {
    console.log(`EVENT: DOMContentLoaded - Scheduling segmented button state update to '${initialTheme}'`);
    setTimeout(() => {
      try {
        console.log(`EVENT: DOMContentLoaded - Setting segmented button selected value to '${initialTheme}'`);
        themeSegmentedButtonSet.selected = initialTheme;
      } catch (err) {
        console.error("EVENT: DOMContentLoaded - Error setting initial segmented button state:", err);
      }
    }, 150); // Adjust delay if needed
  }
});

// System theme change listener
console.log("SCRIPT: Setting up system theme change listener...");
try {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = event => {
    console.log(`EVENT: System theme change detected (Dark: ${event.matches}). Checking if theme is auto...`);
    // Only re-apply if the current setting is 'auto' (i.e., no explicit user choice)
    if (!localStorage.getItem('theme')) {
      console.log("EVENT: Theme is auto, re-applying auto theme...");
      applyTheme('auto');
    } else {
      console.log("EVENT: Theme is not auto (user selected light/dark), ignoring system change.");
    }
  };
  // Use addEventListener if available, otherwise fall back to addListener
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    console.log("SCRIPT: System theme listener added (addEventListener).");
  } else if (mediaQuery.addListener) { // Deprecated but needed for older browsers
    mediaQuery.addListener(handleSystemThemeChange);
    console.log("SCRIPT: System theme listener added (addListener fallback).");
  } else {
    console.warn("SCRIPT: Cannot add system theme listener - unsupported browser?");
  }
} catch (e) {
  console.error("SCRIPT ERROR: Failed to set up system theme listener:", e);
}


// Swipe detection (simplified, ensure it doesn't conflict with other interactions)
let touchStartX = 0;
let touchEndX = 0;
const swipeThreshold = 50; // Minimum pixels swiped
const edgeThreshold = 40; // How close to the edge swipe must start
let isPotentiallySwiping = false;

console.log("SCRIPT: Initializing swipe detection for drawer...");

body.addEventListener('touchstart', e => {
  // Ignore swipes if drawer is open, or if touching interactive elements/scrollable areas
  const targetElement = e.target;
  if (navDrawer?.classList.contains('open') ||
    targetElement.closest('md-dialog, button, a, input, textarea, select, [role="button"], [data-swipe-ignore]') ||
    window.getComputedStyle(targetElement).overflowY === 'scroll' || targetElement.closest('[style*="overflow"]')) {
    isPotentiallySwiping = false;
    touchStartX = 0;
    return;
  }

  const startX = e.touches[0].clientX;
  // Only track swipes starting near the left edge for opening
  if (startX < edgeThreshold) {
    touchStartX = startX;
    touchEndX = startX; // Initialize endX
    isPotentiallySwiping = true;
    // console.log("Swipe Start near edge:", startX); // Debug log
  } else {
    isPotentiallySwiping = false;
    touchStartX = 0;
  }
}, {
  passive: true
}); // Use passive for performance

body.addEventListener('touchmove', e => {
  if (!isPotentiallySwiping) return;
  touchEndX = e.touches[0].clientX;
}, {
  passive: true
});

body.addEventListener('touchend', e => {
  if (!isPotentiallySwiping) return;

  const deltaX = touchEndX - touchStartX;
  // console.log(`Swipe End: deltaX=${deltaX}`); // Debug log

  // Check for a significant swipe to the right
  if (deltaX > swipeThreshold) {
    // Optional: Check if the touchend target is still non-interactive
    const endTarget = document.elementFromPoint(touchEndX, e.changedTouches[0].clientY);
    if (!endTarget || !endTarget.closest('button, a, input, textarea, select, [role="button"]')) {
      console.log(`EVENT touchend: Right swipe detected (deltaX=${deltaX}), opening drawer.`);
      openDrawer();
    } else {
      console.log(`EVENT touchend: Right swipe detected but ended on interactive element, ignoring.`);
    }
  }

  // Reset swipe tracking state
  isPotentiallySwiping = false;
  touchStartX = 0;
  touchEndX = 0;
});


console.log("SCRIPT END: main.js parsed and executed.");