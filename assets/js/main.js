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
    if (message.includes("parsing") || message.includes("extract") || message.includes("structure")) {
      fullMessage += " (Website layout may have changed.)";
    } else if (message.includes("Network error")) {
      fullMessage += " (Could not reach data source.)";
    }
    console.error("showDialogError:", fullMessage);
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
  img.onerror = () => {
    img.src = DEFAULT_ICON_URL;
  };

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
    showDialogError("No apps found in the data.");
    return;
  }

  console.log(`Displaying ${apps.length} apps in dialog.`);
  dialogContent.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'portfolio-grid';

  apps.sort((a, b) => a.name.localeCompare(b.name));

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
      // More specific regex looking for assignment or return of a large array/object
      const scriptRegex = /<script[^>]*nonce="[^"]+"[^>]*>\s*(.*?)\s*<\/script>/gs;
      while ((match = scriptRegex.exec(htmlContent)) !== null) {
        const scriptContent = match[1];
        // Look for common patterns indicating data blocks
        if (scriptContent && (scriptContent.includes('window.IJ_Data') || scriptContent.includes('window.WIZ_global_data')) && scriptContent.includes(DEVELOPER_ID)) {
          // Try to extract a large JSON-like structure (often assigned or returned)
          const jsonLikeRegex = /(?:return|var\s+\w+\s*=|const\s+\w+\s*=|let\s+\w+\s*=)\s*(\{.*\}|\[.*\])\s*;/s;
          let potentialJsonMatch = scriptContent.match(jsonLikeRegex);

          if (potentialJsonMatch && potentialJsonMatch[1] && potentialJsonMatch[1].length > 1000) {
            relevantJsonString = potentialJsonMatch[1];
            extractionMethod = "Script Tag Regex (IJ_Data/WIZ_global_data)";
            console.log("Found potential data using script tag regex.");
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
    if (Array.isArray(jsonData)) {
      console.log(`Parsed data is an Array with ${jsonData.length} elements.`);
    } else if (typeof jsonData === 'object') {
      console.log(`Parsed data is an Object.`);
    }
    return jsonData;

  } catch (error) {
    console.error(`Error during JSON extraction/parsing (Method: ${extractionMethod}):`, error);
    console.error("Failed HTML snippet:", htmlContent.substring(0, 1000));
    console.error("Failed JSON string snippet:", relevantJsonString?.substring(0, 500));
    throw new Error(`Error parsing developer page data: ${error.message}`);
  }
}

// **** REVISED searchForApps function with INTENSIVE LOGGING ****
function searchForApps(jsonElement) {
  console.log("--- Starting searchForApps ---");
  // Log the input structure (abbreviated)
  try {
    console.log("Input Data Sample:", JSON.stringify(jsonElement, (key, value) => {
      // Abbreviate long strings or arrays/objects to keep log manageable
      if (typeof value === 'string' && value.length > 100) return value.substring(0, 97) + "...";
      if (Array.isArray(value) && value.length > 5) return `[Array(${value.length})]`;
      if (typeof value === 'object' && value !== null && Object.keys(value).length > 5) return `{Object(${Object.keys(value).length} keys)}`;
      return value;
    }, 2)?.substring(0, 2000) + "..."); // Limit total log size
  } catch (e) {
    console.error("Error logging input data sample:", e);
  }


  const appInfos = [];
  const knownPackages = new Set();
  let arraysCheckedCount = 0;

  function findDataRecursively(element, targetDepth, currentDepth = 0) {
    if (currentDepth > targetDepth || !element) {
      return null;
    }
    if (Array.isArray(element)) {
      for (const item of element) {
        const result = findDataRecursively(item, targetDepth, currentDepth + 1);
        if (result) return result; // Return the first match found at the target depth
      }
    } else if (typeof element === 'object' && element !== null) {
      if (currentDepth === targetDepth) {
        // If we are at the target depth and it's an object, check if it looks like app data
        // Heuristic: Does it contain a string starting with "com."?
        if (JSON.stringify(element).includes('"com.')) {
          console.log(`DEBUG: Potential app data object found at depth ${targetDepth}:`, JSON.stringify(element).substring(0, 300));
          return element; // Or maybe return specific fields? Needs inspection.
        }
      } else {
        // Continue searching deeper
        for (const key in element) {
          const result = findDataRecursively(element[key], targetDepth, currentDepth + 1);
          if (result) return result;
        }
      }
    }
    return null;
  }


  function traverse(element, path = "root") {
    if (Array.isArray(element)) {
      arraysCheckedCount++;
      // Check if this array looks like a list of apps
      // Heuristic: Does it contain multiple sub-arrays or objects? Does it contain "com." strings?
      const contentSample = JSON.stringify(element).substring(0, 300);
      const containsPackage = contentSample.includes('"com.');
      const containsIconUrl = contentSample.includes('"https://play-lh');

      if (element.length > 0 && containsPackage && containsIconUrl) {
        console.log(`\n🔍 Checking Potential App List Array at path: ${path} [Length: ${element.length}]`);
        console.log(`   Sample: ${contentSample}...`);

        // Iterate through items in *this potentially correct array*
        element.forEach((item, index) => {
          // Assume each 'item' might represent an app's data structure (likely another array or object)
          if (item && (Array.isArray(item) || typeof item === 'object')) {
            console.log(`  >> Examining item[${index}] within potential list...`);
            const itemDataSample = JSON.stringify(item).substring(0, 300);
            console.log(`     Item Sample: ${itemDataSample}...`);

            // Extract data specifically from this 'item'
            const itemStrings = JSON.stringify(item).match(/"(.*?)"/g)?.map(s => s.slice(1, -1)) || []; // Simple string extraction

            const packageName = itemStrings.find(s => s.startsWith("com.") && !s.includes("google") && s.split('.').length >= 2 && s.length < 100);

            if (packageName && !knownPackages.has(packageName)) {
              console.log(`      ✅ Found Package: ${packageName}`);

              let iconUrl = itemStrings.find(s => s.startsWith("https://play-lh.googleusercontent.com") && s.includes('=') && s.match(/\.(png|jpg|jpeg|webp)/i));
              iconUrl = iconUrl || DEFAULT_ICON_URL;
              console.log(`      🔗 Icon URL: ${iconUrl}`);

              // --- Revised Name Finding ---
              let appName = null;
              // Try specific indices within 'item' if it's an array (based on inspection)
              // Common indices: 2, 3, sometimes others
              const potentialNameIndices = [2, 3, 1, 4];
              if (Array.isArray(item)) {
                for (const idx of potentialNameIndices) {
                  if (typeof item[idx] === 'string' && item[idx].match(/[a-zA-Z]/) && item[idx].length > 1 && item[idx].length < 70 && item[idx] !== packageName && !item[idx].startsWith('http')) {
                    appName = item[idx];
                    console.log(`      📛 Found Name (Index [${idx}]): ${appName}`);
                    break;
                  }
                }
              }
              // Fallback: Search strings within item
              if (!appName) {
                appName = itemStrings.find(s =>
                  s !== packageName && !s.startsWith("http") && !s.startsWith("com.") &&
                  s.length > 1 && s.length < 70 && s.match(/[a-zA-Z]/) &&
                  !/^\d+(\.\d+)?(M|k|B)?\+?$/.test(s) &&
                  !/stars?|reviews?|downloads?|installs?|developer|ratings?|null|free|install|update|open/i.test(s) &&
                  !s.includes('ads') && !s.includes('purchases')
                );
                if (appName) console.log(`      📛 Found Name (String Search): ${appName}`);
              }
              appName = appName || packageName; // Final fallback
              if (appName === packageName) console.log(`      📛 Name defaulted to Package Name`);
              // --- End Name Finding ---

              appInfos.push({
                name: appName.trim(),
                iconUrl: iconUrl,
                packageName: packageName
              });
              knownPackages.add(packageName);
            }
          }
        });
      }

      // Continue traversal into children EVEN IF this array wasn't the main app list
      element.forEach((child, index) => traverse(child, `${path}[${index}]`));

    } else if (typeof element === 'object' && element !== null) {
      // Traverse object values
      Object.keys(element).forEach(key => traverse(element[key], `${path}.${key}`));
    }
  }

  try {
    let startElement = jsonElement;
    if (Array.isArray(jsonElement) && jsonElement.length === 1) {
      console.log("Input is single-element array, starting traversal from element [0].");
      startElement = jsonElement[0];
    } else {
      console.log("Input is not a single-element array, starting traversal from root.");
    }

    traverse(startElement); // Start traversal

    console.log(`--- App search finished. Checked ${arraysCheckedCount} arrays. Final app count: ${appInfos.length} ---`);
    if (appInfos.length === 0) {
      console.warn("Traversal complete, but no apps extracted. The data structure might be unrecognized or the heuristics failed.");
      console.warn("Consider manually inspecting the 'Input Data Sample' log above and the 'Checking Potential App List Array' logs to identify the correct data paths.");
    }
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
      signal: AbortSignal.timeout(20000) // Increased timeout slightly
    });

    const responseText = await response.text();

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
    const jsonData = extractJsonData(htmlContent);
    const apps = searchForApps(jsonData);
    displayAppsInDialog(apps);

  } catch (error) {
    console.error("ERROR in fetchAndDisplayDeveloperApps:", error);
    if (error.name === 'TimeoutError') {
      showDialogError("Loading apps timed out. Please try again.");
    } else {
      showDialogError(error.message || "An unexpected error occurred.");
    }
  }
}


// --- Event Listeners ---

// Drawer
if (menuButton) menuButton.addEventListener('click', openDrawer);
else console.error("Menu button missing");
if (closeDrawerButton) closeDrawerButton.addEventListener('click', closeDrawer);
else console.error("Close drawer button missing");
if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
else console.error("Drawer overlay missing");

// Collapsible Sections
toggleSection(moreToggle, moreContent);
toggleSection(appsToggle, appsContent);

// Theme Toggle
if (themeSegmentedButtonSet) {
  themeSegmentedButtonSet.addEventListener('segmented-button-set-selection', (e) => {
    applyTheme(e.detail.button.value);
  });
} else {
  console.error("Theme button set missing");
}

// Portfolio Dialog
if (viewPortfolioButton && portfolioDialog) {
  viewPortfolioButton.addEventListener('click', fetchAndDisplayDeveloperApps);
} else {
  console.error("Portfolio button or dialog missing");
}
if (closePortfolioDialogButton && portfolioDialog) {
  closePortfolioDialogButton.addEventListener('click', () => {
    portfolioDialog.close("closed-by-button");
  });
} else {
  console.error("Portfolio close button or dialog missing");
}

// --- Initial Theme Application ---
document.addEventListener('DOMContentLoaded', () => {
  console.log("Applying initial theme on DOMContentLoaded...");
  const savedTheme = localStorage.getItem('theme');
  applyTheme(savedTheme || 'auto');

  const currentTheme = savedTheme || 'auto';
  if (themeSegmentedButtonSet) {
    setTimeout(() => {
      try {
        themeSegmentedButtonSet.selected = currentTheme;
        console.log(`Initial segmented button state set to: ${currentTheme}`);
      } catch (err) {
        console.error("Error setting initial segmented button state:", err);
      }
    }, 100);
  }
});

// --- System Theme Change Listener ---
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
const handleSystemThemeChange = (event) => {
  if (!localStorage.getItem('theme')) {
    applyTheme('auto');
  }
};
try {
  mediaQuery.addEventListener('change', handleSystemThemeChange);
} catch (e) {
  try {
    mediaQuery.addListener(handleSystemThemeChange);
  } catch (e2) {
    console.error("Error adding theme listener:", e2);
  }
}

// --- Swipe To Open Drawer Logic ---
let touchStartX = 0,
  touchEndX = 0;
const swipeThreshold = 50,
  edgeThreshold = 40;
let isPotentiallySwiping = false;
console.log("Swipe detection initialized.");
body.addEventListener('touchstart', (e) => {
  const targetElement = e.target;
  if (targetElement.closest('md-dialog, button, a, md-icon-button, md-text-button, md-filled-button, md-outlined-button, md-chip, [data-swipe-ignore]') || window.getComputedStyle(targetElement).overflowY === 'scroll' || targetElement.closest('[style*="overflow"]')) {
    isPotentiallySwiping = false;
    touchStartX = 0;
    return;
  }
  const startX = e.touches[0].clientX;
  if (startX < edgeThreshold && !navDrawer.classList.contains('open')) {
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
body.addEventListener('touchmove', (e) => {
  if (isPotentiallySwiping) touchEndX = e.touches[0].clientX;
}, {
  passive: true
});
body.addEventListener('touchend', (e) => {
  if (!isPotentiallySwiping) return;
  const deltaX = touchEndX - touchStartX;
  if (deltaX > swipeThreshold) {
    const endTarget = document.elementFromPoint(touchEndX, e.changedTouches[0].clientY);
    if (!endTarget || !endTarget.closest('button, a, md-icon-button, md-text-button, md-filled-button, md-outlined-button, md-chip')) {
      openDrawer();
    }
  }
  isPotentiallySwiping = false;
  touchStartX = 0;
  touchEndX = 0;
});
// --- End Swipe Logic ---

console.log("Main script execution finished.");