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

// --- IMPORTANT: Server-Side Proxy Required ---
// You MUST implement a server-side endpoint to fetch the Google Play page
// due to browser CORS restrictions and the unreliability of public proxies.
// This endpoint should fetch the 'PLAY_STORE_RAW_URL' and return the raw HTML content.
// Example endpoint on your own domain:
const PROXY_ENDPOINT_URL = '/api/fetch-play-store'; // Replace with your actual proxy endpoint
// ---------------------------------------------

const PLAY_STORE_RAW_URL = `https://play.google.com/store/apps/dev?id=${DEVELOPER_ID}&hl=en&gl=us`;
const DEFAULT_ICON_URL = "https://c.clc2l.com/t/g/o/google-playstore-Iauj7q.png"; // Or use a local placeholder
const PLAY_STORE_APP_URL = "https://play.google.com/store/apps/details?id=";
const FETCH_TIMEOUT_MS = 30000; // 30 seconds (adjust as needed for your proxy)
console.log("SCRIPT: Constants defined. Will fetch via proxy endpoint:", PROXY_ENDPOINT_URL);

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
      themeSegmentedButtonSet.selected = finalTheme;
      console.log(`FUNC applyTheme: Set segmented button selected value to '${finalTheme}'`);
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
      // Added note about checking the proxy
      fullMessage += " (Network error or issue with the server-side proxy. Check the '/api/fetch-play-store' endpoint implementation and logs.)";
    } else if (message.toLowerCase().includes("timeout")) {
      fullMessage += ` (The request to the proxy timed out after ${FETCH_TIMEOUT_MS / 1000} seconds.)`;
    } else if (message.toLowerCase().includes("parsing") || message.toLowerCase().includes("extract") || message.toLowerCase().includes("structure")) {
      fullMessage += " (Could not read data from the fetched page. Google Play website layout may have changed.)";
    } else if (message.toLowerCase().includes("network error")) {
      fullMessage += " (Could not reach the server-side proxy endpoint.)";
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
  if (!appInfo || !appInfo.packageName || !appInfo.name) {
    console.warn("FUNC createAppCardElement: Invalid appInfo received", appInfo);
    return null;
  }
  const card = document.createElement('a');
  card.href = `${PLAY_STORE_APP_URL}${appInfo.packageName}`;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.className = 'app-card';
  card.title = `${appInfo.name} - ${appInfo.packageName}`;

  const img = document.createElement('img');
  img.src = (appInfo.iconUrl && appInfo.iconUrl.startsWith('https://')) ? appInfo.iconUrl : DEFAULT_ICON_URL;
  img.alt = `${appInfo.name} Icon`;
  img.loading = "lazy";
  img.onerror = () => {
    console.warn(`FUNC createAppCardElement: Image failed to load for ${appInfo.packageName}, using default.`);
    img.src = DEFAULT_ICON_URL;
    img.onerror = null;
  };

  const name = document.createElement('p');
  name.textContent = appInfo.name;

  card.appendChild(img);
  card.appendChild(name);
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
    showDialogError("Received invalid app data from parsing.");
    return;
  }

  if (apps.length === 0) {
    console.warn("FUNC displayAppsInDialog: No apps found to display after parsing.");
    showDialogError("No apps found for this developer in the fetched data.");
    return;
  }

  console.log(`FUNC displayAppsInDialog: Preparing to display ${apps.length} apps.`);
  dialogContent.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'portfolio-grid';

  let cardsAdded = 0;
  apps.forEach(app => {
    try {
      const card = createAppCardElement(app);
      if (card) {
        grid.appendChild(card);
        cardsAdded++;
      }
    } catch (error) {
      console.error(`FUNC displayAppsInDialog: Error creating card for app:`, app, error);
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


// --- Data Extraction and Parsing (No changes needed here) ---
// This part remains the same as it operates on the fetched HTML content

function extractJsonData(htmlContent) {
  console.log("FUNC extractJsonData: Starting extraction...");
  if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.length < 500) {
    console.error("FUNC extractJsonData: Input htmlContent is invalid or too short.");
    throw new Error("Invalid HTML content received for extraction.");
  }
  console.log(`FUNC extractJsonData: Processing HTML content (Length: ${htmlContent.length})`);

  try {
    console.log("FUNC extractJsonData: Attempting Method 1 (AF_initDataCallback)...");
    const dataCallbackRegex = /AF_initDataCallback\s*\(\s*(\{.*?\})\s*\)\s*;/gs;
    let match;
    let relevantJsonString = null;
    let foundKey = null;

    while ((match = dataCallbackRegex.exec(htmlContent)) !== null) {
      const callbackContent = match[1];
      if (callbackContent && /['"]ds:\d+['"]/.test(callbackContent)) {
        console.log("FUNC extractJsonData: Found AF_initDataCallback block with a 'ds:' key.");
        const dataMatch = callbackContent.match(/,\s*key:\s*['"](ds:\d+)['"]\s*,\s*hash:\s*['"][^'"]+['"]\s*,\s*data:\s*(\[.*?\])\s*,\s*sideChannel/s);
        if (dataMatch && dataMatch[1] && dataMatch[2]) {
          foundKey = dataMatch[1];
          relevantJsonString = dataMatch[2];
          console.log(`FUNC extractJsonData: Extracted 'data' array associated with key '${foundKey}'.`);
          break;
        } else {
          console.log(`FUNC extractJsonData: Could not find specific 'key/data' structure in this callback block, will keep searching.`);
        }
      }
    }

    if (!relevantJsonString) {
      console.log("FUNC extractJsonData: Specific key/data structure not found, trying broader search within AF_initDataCallback...");
      dataCallbackRegex.lastIndex = 0;
      while ((match = dataCallbackRegex.exec(htmlContent)) !== null) {
        const callbackContent = match[1];
        if (callbackContent && /['"]ds:\d+['"]/.test(callbackContent)) {
          const genericArrayMatch = callbackContent.match(/:\s*(\[.*\])/s);
          if (genericArrayMatch && genericArrayMatch[1] && genericArrayMatch[1].length > 1000) {
            relevantJsonString = genericArrayMatch[1];
            console.log(`FUNC extractJsonData: Found a large array within an AF_initDataCallback block (fallback).`);
            break;
          }
        }
      }
    }

    if (!relevantJsonString) {
      console.error("FUNC extractJsonData: Failed to find relevant JSON data structure in the HTML.");
      throw new Error("Failed to extract JSON data structure from HTML.");
    }

    console.log(`FUNC extractJsonData: Extraction successful. String length: ${relevantJsonString.length}. Preparing to parse...`);
    let cleanedJsonString = relevantJsonString
      .replace(/undefined/g, 'null')
      .replace(/,\s*([\]}])/g, '$1');

    console.log("FUNC extractJsonData: Parsing cleaned JSON string...");
    const jsonData = JSON.parse(cleanedJsonString);
    console.log("FUNC extractJsonData: JSON parsing successful.");
    return jsonData;

  } catch (error) {
    console.error(`FUNC extractJsonData: Error during extraction or parsing:`, error);
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

  function flattenStrings(element) {
    if (typeof element === 'string') return [element];
    if (Array.isArray(element)) return element.flatMap(flattenStrings);
    if (element && typeof element === 'object') return Object.values(element).flatMap(flattenStrings);
    return [];
  }

  function traverse(element) {
    if (Array.isArray(element)) {
      const strings = flattenStrings(element);
      const packageName = strings.find(s => s && s.startsWith('com.') && !s.includes('google') && s.split('.').length >= 2);

      if (packageName && !knownPackages.has(packageName)) {
        const iconUrl = strings.find(s => s && s.startsWith('https://play-lh.googleusercontent.com/'));
        let appName = null;
        if (typeof element[2] === 'string' && element[2].length > 1 && element[2].length < 100) appName = element[2];
        else if (typeof element[3] === 'string' && element[3].length > 1 && element[3].length < 100) appName = element[3];
        if (!appName) {
          appName = strings.find(s => s && s !== packageName && !s.startsWith('https://') && s.length > 1 && s.length < 100 && !/^\d+(\.\d+)?$/.test(s));
        }
        appName = appName || packageName;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = appName;
        appName = tempDiv.textContent || tempDiv.innerText || appName;

        appInfos.push({
          name: appName.trim(),
          iconUrl: iconUrl || DEFAULT_ICON_URL,
          packageName: packageName
        });
        knownPackages.add(packageName);
      } else {
        element.forEach(traverse);
      }
    } else if (element && typeof element === 'object') {
      Object.values(element).forEach(traverse);
    }
  }

  dataArray.forEach(traverse);
  console.log(`FUNC searchForApps: Found ${appInfos.length} unique apps.`);
  if (appInfos.length === 0) {
    console.warn("FUNC searchForApps: No apps could be extracted from the provided data structure. The structure might have changed significantly.");
  }
  return appInfos.sort((a, b) => a.name.localeCompare(b.name));
}


// --- Main Fetch and Display Logic (Updated for Proxy) ---
async function fetchAndDisplayDeveloperApps() {
  const functionName = "FUNC fetchAndDisplayDeveloperApps";
  console.log(`${functionName}: Starting...`);

  if (!portfolioDialog || !dialogContent) {
    console.error(`${functionName}: Portfolio dialog or content area element not found.`);
    return;
  }

  try {
    portfolioDialog.show();
    console.log(`${functionName}: Dialog shown.`);
    showDialogLoading();

    // Construct the URL for your proxy endpoint.
    // Pass the target URL as a query parameter for the proxy to fetch.
    const proxyUrl = `${PROXY_ENDPOINT_URL}?target=${encodeURIComponent(PLAY_STORE_RAW_URL)}`;
    console.log(`${functionName}: Fetching via proxy: ${proxyUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(proxyUrl, { // Fetch from YOUR proxy endpoint
      signal: controller.signal,
      headers: {
        // You might not need special headers here, depends on your proxy setup
        'Accept': 'text/html' // Indicate we expect HTML back
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle errors from YOUR proxy (e.g., 404 if endpoint not found, 500 if proxy failed)
      throw new Error(`Failed to fetch from proxy: ${response.status} ${response.statusText}`);
    }

    console.log(`${functionName}: Proxy fetch successful. Getting HTML content...`);
    // Expect raw HTML directly from the proxy's response body
    const htmlContent = await response.text();

    if (!htmlContent || htmlContent.length < 500) {
      throw new Error("Invalid or empty response received from proxy.");
    }

    console.log(`${functionName}: HTML content received (Length: ${htmlContent.length}). Extracting data...`);
    const jsonData = extractJsonData(htmlContent);

    console.log(`${functionName}: Data extracted. Searching for apps...`);
    const apps = searchForApps(jsonData);

    console.log(`${functionName}: App search complete. Displaying apps...`);
    displayAppsInDialog(apps);

    console.log(`${functionName}: Process completed successfully.`);

  } catch (error) {
    console.error(`${functionName}: CATCH BLOCK - Error occurred:`, error);
    let displayError = error.message;
    if (error.name === 'AbortError') {
      displayError = `Request to proxy timed out after ${FETCH_TIMEOUT_MS / 1000} seconds.`;
    }
    // Ensure specific error message about proxy failure is clear
    else if (error.message.includes("proxy")) {
      displayError = error.message + " Please check the server-side proxy implementation.";
    }
    showDialogError(displayError);
  } finally {
    console.log(`${functionName}: --- Finished ---`);
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
    if (portfolioDialog.open) {
      console.log("EVENT: Portfolio dialog already open, not re-fetching.");
      return;
    }
    fetchAndDisplayDeveloperApps(); // Uses the proxy fetch now
  });
  console.log("SCRIPT: Portfolio button listener added.");
} else {
  console.error("SCRIPT ERROR: Portfolio button or dialog missing");
}

// Portfolio close button listener
if (closePortfolioDialogButton && portfolioDialog) {
  closePortfolioDialogButton.addEventListener('click', () => {
    console.log("EVENT: closePortfolioDialogButton clicked");
    portfolioDialog.close("closed-by-button");
  });
  console.log("SCRIPT: Portfolio close button listener added.");
} else {
  console.error("SCRIPT ERROR: Portfolio close button or dialog missing");
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  console.log("EVENT: DOMContentLoaded - Applying initial theme...");
  const savedTheme = localStorage.getItem('theme');
  console.log(`EVENT: DOMContentLoaded - Saved theme from localStorage: '${savedTheme}'`);
  const initialTheme = savedTheme || 'auto';
  applyTheme(initialTheme);

  if (themeSegmentedButtonSet) {
    console.log(`EVENT: DOMContentLoaded - Scheduling segmented button state update to '${initialTheme}'`);
    setTimeout(() => {
      try {
        console.log(`EVENT: DOMContentLoaded - Setting segmented button selected value to '${initialTheme}'`);
        themeSegmentedButtonSet.selected = initialTheme;
      } catch (err) {
        console.error("EVENT: DOMContentLoaded - Error setting initial segmented button state:", err);
      }
    }, 150);
  }
});

// System theme change listener
console.log("SCRIPT: Setting up system theme change listener...");
try {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = event => {
    console.log(`EVENT: System theme change detected (Dark: ${event.matches}). Checking if theme is auto...`);
    if (!localStorage.getItem('theme')) {
      console.log("EVENT: Theme is auto, re-applying auto theme...");
      applyTheme('auto');
    } else {
      console.log("EVENT: Theme is not auto (user selected light/dark), ignoring system change.");
    }
  };
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    console.log("SCRIPT: System theme listener added (addEventListener).");
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(handleSystemThemeChange);
    console.log("SCRIPT: System theme listener added (addListener fallback).");
  } else {
    console.warn("SCRIPT: Cannot add system theme listener - unsupported browser?");
  }
} catch (e) {
  console.error("SCRIPT ERROR: Failed to set up system theme listener:", e);
}


// Swipe detection
let touchStartX = 0;
let touchEndX = 0;
const swipeThreshold = 50;
const edgeThreshold = 40;
let isPotentiallySwiping = false;
console.log("SCRIPT: Initializing swipe detection for drawer...");
body.addEventListener('touchstart', e => {
  const targetElement = e.target;
  if (navDrawer?.classList.contains('open') ||
    targetElement.closest('md-dialog, button, a, input, textarea, select, [role="button"], [data-swipe-ignore]') ||
    window.getComputedStyle(targetElement).overflowY === 'scroll' || targetElement.closest('[style*="overflow"]')) {
    isPotentiallySwiping = false;
    touchStartX = 0;
    return;
  }
  const startX = e.touches[0].clientX;
  if (startX < edgeThreshold) {
    touchStartX = startX;
    touchEndX = startX;
    isPotentiallySwiping = true;
  } else {
    isPotentiallySwiping = false;
    touchStartX = 0;
  }
}, {
  passive: true
});
body.addEventListener('touchmove', e => {
  if (!isPotentiallySwiping) return;
  touchEndX = e.touches[0].clientX;
}, {
  passive: true
});
body.addEventListener('touchend', e => {
  if (!isPotentiallySwiping) return;
  const deltaX = touchEndX - touchStartX;
  if (deltaX > swipeThreshold) {
    const endTarget = document.elementFromPoint(touchEndX, e.changedTouches[0].clientY);
    if (!endTarget || !endTarget.closest('button, a, input, textarea, select, [role="button"]')) {
      console.log(`EVENT touchend: Right swipe detected (deltaX=${deltaX}), opening drawer.`);
      openDrawer();
    } else {
      console.log(`EVENT touchend: Right swipe detected but ended on interactive element, ignoring.`);
    }
  }
  isPotentiallySwiping = false;
  touchStartX = 0;
  touchEndX = 0;
});

console.log("SCRIPT END: main.js parsed and executed.");