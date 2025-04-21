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
const DEVELOPER_ID = "5390214922640123642";
const CORS_PROXY_URL = "https://api.allorigins.win/get?url=";
const PLAY_STORE_RAW_URL = `https://play.google.com/store/apps/dev?id=${DEVELOPER_ID}&hl=en&gl=us`;
const DEVELOPER_PAGE_URL = `${CORS_PROXY_URL}${encodeURIComponent(PLAY_STORE_RAW_URL)}`;
const DEFAULT_ICON_URL = "https://c.clc2l.com/t/g/o/google-playstore-Iauj7q.png";
const PLAY_STORE_APP_URL = "https://play.google.com/store/apps/details?id=";
console.log("SCRIPT: Constants defined. DEVELOPER_PAGE_URL:", DEVELOPER_PAGE_URL);

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
    if (contentElement.id === 'moreContent' && appsContent?.classList.contains('open')) {
      console.log(`${functionName}: Closing 'appsContent'`);
      appsContent.classList.remove('open');
      appsToggle?.classList.remove('expanded');
    } else if (contentElement.id === 'appsContent' && moreContent?.classList.contains('open')) {
      console.log(`${functionName}: Closing 'moreContent'`);
      moreContent.classList.remove('open');
      moreToggle?.classList.remove('expanded');
    }
    contentElement.classList.toggle('open', !isExpanded);
    toggleButton.classList.toggle('expanded', !isExpanded);
    console.log(`${functionName}: Toggled. Now expanded? ${!isExpanded}`);
  });
}

function applyTheme(theme) {
  console.log(`FUNC applyTheme: Called with theme='${theme}'`);
  htmlElement.classList.remove('dark');
  let finalTheme = theme;
  let themeSource = "Argument";
  if (theme === 'dark') {
    htmlElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else if (theme === 'light') {
    localStorage.setItem('theme', 'light');
  } else {
    finalTheme = 'auto';
    themeSource = "Auto";
    localStorage.removeItem('theme');
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      htmlElement.classList.add('dark');
      themeSource = "Auto (System Dark)";
    } else {
      themeSource = "Auto (System Light)";
    }
  }
  console.log(`FUNC applyTheme: ${themeSource} theme applied. localStorage['theme']='${localStorage.getItem('theme') || 'null'}'. Dark class present? ${htmlElement.classList.contains('dark')}`);
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
    if (message.includes("parsing") || message.includes("extract") || message.includes("structure")) {
      fullMessage += " (Website layout may have changed.)";
    } else if (message.includes("Network error")) {
      fullMessage += " (Could not reach data source.)";
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

function createAppCardElement(appInfo) {
  console.log(`FUNC createAppCardElement: Creating card for ${appInfo.packageName}`);
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
    console.warn(`FUNC createAppCardElement: Image failed to load for ${appInfo.packageName}, using default.`);
    img.src = DEFAULT_ICON_URL;
  };
  const name = document.createElement('p');
  name.textContent = appInfo.name;
  card.appendChild(img);
  card.appendChild(name);
  console.log(`FUNC createAppCardElement: Card created successfully for ${appInfo.packageName}`);
  return card;
}

function displayAppsInDialog(apps) {
  console.log("FUNC displayAppsInDialog: Called.");
  if (!dialogContent) {
    console.error("FUNC displayAppsInDialog: dialogContent element not found!");
    return;
  }
  if (!apps || apps.length === 0) {
    console.warn("FUNC displayAppsInDialog: No apps array provided or array is empty.");
    showDialogError("No apps found in the data.");
    return;
  }
  console.log(`FUNC displayAppsInDialog: Preparing to display ${apps.length} apps.`);
  dialogContent.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'portfolio-grid';
  apps.forEach(app => {
    try {
      const card = createAppCardElement(app);
      grid.appendChild(card);
    } catch (error) {
      console.error(`FUNC displayAppsInDialog: Error creating card for app:`, app, error);
    }
  });
  dialogContent.appendChild(grid);
  console.log("FUNC displayAppsInDialog: Grid with app cards appended.");
}

function extractJsonData(htmlContent) {
  console.log("FUNC extractJsonData: Starting...");
  if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.length < 100) {
    console.error("FUNC extractJsonData: Input htmlContent is invalid or too short.");
    throw new Error("Invalid HTML content provided for extraction.");
  }
  console.log(`FUNC extractJsonData: Processing HTML content (Length: ${htmlContent.length})`);
  let relevantJsonString = null;
  let extractionMethod = "None";
  try {
    console.log("FUNC extractJsonData: Attempting Method 1 (AF_initDataCallback)...");
    const dataCallbackRegex = /AF_initDataCallback\s*\(\s*(\{.*?\})\s*\)\s*;/gs;
    let match;
    while ((match = dataCallbackRegex.exec(htmlContent)) !== null) {
      const callbackContent = match[1];
      if (callbackContent && callbackContent.match(/['"]ds:\d+['"]/)) {
        console.log("FUNC extractJsonData: Found AF_initDataCallback block.");
        const dataMatch = callbackContent.match(/data\s*:\s*(\[.*?\])\s*,\s*sideChannel/s);
        if (dataMatch && dataMatch[1]) {
          relevantJsonString = dataMatch[1];
          extractionMethod = "AF_initDataCallback ('data:' key)";
          console.log(`FUNC extractJsonData: Found 'data' key in AF_initDataCallback.`);
          break;
        }
        console.log("FUNC extractJsonData: 'data' key not found directly.");
      }
    }
    if (!relevantJsonString) {
      console.log("FUNC extractJsonData: Method 1 failed, attempting Method 2 (Script Tag Fallback)...");
      const scriptRegex = /<script[^>]*nonce="[^"]+"[^>]*>\s*(.*?)\s*<\/script>/gs;
      let scriptCount = 0;
      while ((match = scriptRegex.exec(htmlContent)) !== null) {
        scriptCount++;
        const scriptContent = match[1];
        if (scriptContent && (scriptContent.includes('window.IJ_Data') || scriptContent.includes('window.WIZ_global_data')) && scriptContent.includes(DEVELOPER_ID)) {
          console.log(`FUNC extractJsonData: Found potentially relevant script tag #${scriptCount}.`);
          const potentialJsonMatch = scriptContent.match(/(?:return|var\s+\w+\s*=|const\s+\w+\s*=|let\s+\w+\s*=)\s*(\{.*\}|\[.*\])\s*;/s);
          if (potentialJsonMatch && potentialJsonMatch[1] && potentialJsonMatch[1].length > 1000) {
            relevantJsonString = potentialJsonMatch[1];
            extractionMethod = "Script Tag Regex (IJ_Data/WIZ_global_data)";
            console.log("FUNC extractJsonData: Extracted large JSON structure from script tag.");
            break;
          }
        }
      }
      console.log(`FUNC extractJsonData: Checked ${scriptCount} script tags.`);
    }
    if (!relevantJsonString) {
      console.error("FUNC extractJsonData: Failed to find relevant JSON structure.");
      throw new Error("Failed to extract JSON data structure from HTML.");
    }
    console.log(`FUNC extractJsonData: Extraction successful using method: ${extractionMethod}. String length: ${relevantJsonString.length}`);
    console.log("FUNC extractJsonData: Cleaning JSON string...");
    let cleanedJsonString = relevantJsonString
      .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/undefined/g, 'null')
      .replace(/,\s*([\]}])/g, '$1');
    console.log("FUNC extractJsonData: Parsing cleaned JSON string...");
    const jsonData = JSON.parse(cleanedJsonString);
    console.log("FUNC extractJsonData: JSON parsing successful.");
    return jsonData;
  } catch (error) {
    console.error(`FUNC extractJsonData: Error during extraction/parsing (Method: ${extractionMethod}):`, error);
    throw new Error(`Error parsing data: ${error.message}`);
  }
}

function searchForApps(jsonElement) {
  console.log("FUNC searchForApps: --- Starting ---");
  const appInfos = [];
  const knownPackages = new Set();

  function flattenStrings(element) {
    console.log(`flattenStrings: Processing type: ${typeof element}`);
    if (typeof element === 'string') {
      return [element];
    } else if (Array.isArray(element)) {
      return element.flatMap(flattenStrings);
    } else if (element && typeof element === 'object') {
      return Object.values(element).flatMap(flattenStrings);
    }
    return [];
  }

  function traverse(element, path = 'root') {
    console.log(`TRAVERSE: Path='${path}', Type='${Array.isArray(element) ? 'Array' : typeof element}'`);
    if (Array.isArray(element)) {
      const strings = flattenStrings(element);
      const packageName = strings.find(s => s.startsWith('com.')) || '';
      if (packageName && !knownPackages.has(packageName)) {
        console.log(`TRAVERSE: Found packageName='${packageName}'`);
        const iconUrl = strings.find(s => s.startsWith('https://')) || DEFAULT_ICON_URL;
        console.log(`TRAVERSE: Using iconUrl='${iconUrl}'`);
        const suggestedName = element[3] && typeof element[3] === 'string' && element[3] !== 'null' && /[A-Za-z]/.test(element[3]) && element[3].length < 50 ? element[3] : null;
        if (suggestedName) console.log(`TRAVERSE: Found suggestedName='${suggestedName}'`);
        const alternativeName = strings.find(s => s !== packageName && !s.startsWith('https://') && /[A-Za-z]/.test(s) && s.length < 50) || null;
        if (alternativeName) console.log(`TRAVERSE: Found alternativeName='${alternativeName}'`);
        const appName = suggestedName || alternativeName || packageName;
        console.log(`TRAVERSE: Final appName='${appName}'`);
        appInfos.push({
          name: appName,
          iconUrl,
          packageName
        });
        knownPackages.add(packageName);
      }
      element.forEach((child, index) => traverse(child, `${path}[${index}]`));
    } else if (element && typeof element === 'object') {
      Object.entries(element).forEach(([key, value]) => traverse(value, `${path}.${key}`));
    }
  }

  traverse(jsonElement);
  console.log(`FUNC searchForApps: Found ${appInfos.length} apps`);
  return appInfos.sort((a, b) => a.name.localeCompare(b.name));
}

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
    console.log(`${functionName}: Fetching from URL: ${DEVELOPER_PAGE_URL}`);
    const response = await fetch(DEVELOPER_PAGE_URL, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Network error: ${response.status} ${response.statusText}`);
    const json = await response.json();         // { contents: "<!doctype html>…", status: { … } }
    const htmlContent = json.contents;
    console.log(`${functionName}: Response text received (Length: ${responseText.length})`);
    if (!response.ok) {
      let errorMsg = `Network error: ${response.status} ${response.statusText}.`;
      if (response.status === 403) errorMsg += " Access Forbidden (Proxy Blocked?).";
      else if (response.status === 404) errorMsg += " Not Found.";
      else if (response.status === 429) errorMsg += " Too Many Requests (Rate Limited?).";
      else if (response.status >= 500) errorMsg += " Server error.";
      throw new Error(errorMsg);
    }
    console.log(`${functionName}: Calling extractJsonData...`);
    const jsonData = extractJsonData(htmlContent);
    console.log(`${functionName}: Calling searchForApps...`);
    const apps = searchForApps(jsonData);
    console.log(`${functionName}: Calling displayAppsInDialog...`);
    displayAppsInDialog(apps);
    console.log(`${functionName}: Process completed successfully.`);
  } catch (error) {
    console.error(`${functionName}: CATCH BLOCK - Error occurred:`, error);
    let displayError = error.name === 'TimeoutError' ? "Loading apps timed out. Please try again." : error.message;
    showDialogError(displayError);
  } finally {
    console.log(`${functionName}: --- Finished ---`);
  }
}

console.log("SCRIPT: Setting up event listeners...");
if (menuButton) menuButton.addEventListener('click', openDrawer);
else console.error("SCRIPT ERROR: Menu button missing");
if (closeDrawerButton) closeDrawerButton.addEventListener('click', closeDrawer);
else console.error("SCRIPT ERROR: Close drawer button missing");
if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
else console.error("SCRIPT ERROR: Drawer overlay missing");
toggleSection(moreToggle, moreContent);
toggleSection(appsToggle, appsContent);
if (themeSegmentedButtonSet) {
  themeSegmentedButtonSet.addEventListener('segmented-button-set-selection', e => {
    console.log("EVENT: themeSegmentedButtonSet selection changed");
    applyTheme(e.detail.button.value);
  });
  console.log("SCRIPT: Theme toggle listener added.");
} else {
  console.error("SCRIPT ERROR: Theme button set missing");
}
if (viewPortfolioButton && portfolioDialog) {
  viewPortfolioButton.addEventListener('click', () => {
    console.log("EVENT: viewPortfolioButton clicked");
    fetchAndDisplayDeveloperApps();
  });
  console.log("SCRIPT: Portfolio button listener added.");
} else {
  console.error("SCRIPT ERROR: Portfolio button or dialog missing");
}
if (closePortfolioDialogButton && portfolioDialog) {
  closePortfolioDialogButton.addEventListener('click', () => {
    console.log("EVENT: closePortfolioDialogButton clicked");
    portfolioDialog.close("closed-by-button");
  });
  console.log("SCRIPT: Portfolio close button listener added.");
} else {
  console.error("SCRIPT ERROR: Portfolio close button or dialog missing");
}
document.addEventListener('DOMContentLoaded', () => {
  console.log("EVENT: DOMContentLoaded - Applying initial theme...");
  const savedTheme = localStorage.getItem('theme');
  console.log(`EVENT: DOMContentLoaded - Saved theme from localStorage: '${savedTheme}'`);
  applyTheme(savedTheme || 'auto');
  const currentTheme = savedTheme || 'auto';
  if (themeSegmentedButtonSet) {
    console.log(`EVENT: DOMContentLoaded - Scheduling segmented button state update to '${currentTheme}'`);
    setTimeout(() => {
      try {
        console.log(`EVENT: DOMContentLoaded - Setting segmented button selected value to '${currentTheme}'`);
        themeSegmentedButtonSet.selected = currentTheme;
      } catch (err) {
        console.error("EVENT: DOMContentLoaded - Error setting initial segmented button state:", err);
      }
    }, 150);
  }
});
console.log("SCRIPT: Setting up system theme change listener...");
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
const handleSystemThemeChange = event => {
  console.log(`EVENT: System theme change detected (Dark: ${event.matches}). Checking if theme is auto...`);
  if (!localStorage.getItem('theme')) {
    console.log("EVENT: Theme is auto, re-applying auto theme...");
    applyTheme('auto');
  } else {
    console.log("EVENT: Theme is not auto, ignoring system change.");
  }
};
try {
  mediaQuery.addEventListener('change', handleSystemThemeChange);
  console.log("SCRIPT: System theme listener added (addEventListener).");
} catch {
  try {
    mediaQuery.addListener(handleSystemThemeChange);
    console.log("SCRIPT: System theme listener added (addListener fallback).");
  } catch (e) {
    console.error("SCRIPT ERROR: Failed to add system theme listener:", e);
  }
}
let touchStartX = 0,
  touchEndX = 0;
const swipeThreshold = 50,
  edgeThreshold = 40;
let isPotentiallySwiping = false;
console.log("SCRIPT: Initializing swipe detection...");
body.addEventListener('touchstart', e => {
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
    if (!endTarget || !endTarget.closest('button, a, md-icon-button, md-text-button, md-filled-button, md-outlined-button, md-chip')) {
      console.log(`EVENT touchend: Swipe detected (deltaX=${deltaX}), opening drawer.`);
      openDrawer();
    }
  }
  isPotentiallySwiping = false;
  touchStartX = 0;
  touchEndX = 0;
});
console.log("SCRIPT END: main.js parsed and executed.");