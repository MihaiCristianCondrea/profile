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
const PROXY_ENDPOINT_URL = '/api/fetch-play-store';
const PLAY_STORE_RAW_URL = `https://play.google.com/store/apps/dev?id=${DEVELOPER_ID}&hl=en&gl=us`;
const DEFAULT_ICON_URL = "https://c.clc2l.com/t/g/o/google-playstore-Iauj7q.png";
const PLAY_STORE_APP_URL = "https://play.google.com/store/apps/details?id=";
const FETCH_TIMEOUT_MS = 30000;
console.log("SCRIPT: Constants defined. Will fetch via proxy endpoint:", PROXY_ENDPOINT_URL);

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
  const fn = `FUNC toggleSection (Button ID: ${toggleButton?.id}, Content ID: ${contentElement?.id})`;
  console.log(`${fn}: Setting up listener`);
  if (!toggleButton || !contentElement) {
    console.error(`${fn}: Button or content element missing`);
    return;
  }
  toggleButton.addEventListener('click', () => {
    console.log(`${fn}: Clicked`);
    const isExpanded = contentElement.classList.contains('open');
    if (contentElement.id === 'moreContent' && appsContent?.classList.contains('open')) {
      appsContent.classList.remove('open');
      appsToggle?.classList.remove('expanded');
      console.log(`${fn}: Closed 'appsContent'`);
    } else if (contentElement.id === 'appsContent' && moreContent?.classList.contains('open')) {
      moreContent.classList.remove('open');
      moreToggle?.classList.remove('expanded');
      console.log(`${fn}: Closed 'moreContent'`);
    }
    contentElement.classList.toggle('open', !isExpanded);
    toggleButton.classList.toggle('expanded', !isExpanded);
    console.log(`${fn}: Toggled. Now expanded? ${!isExpanded}`);
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
  console.log(`FUNC applyTheme: ${themeSource} theme applied. localStorage['theme']='${localStorage.getItem('theme') || 'auto'}'. Dark class present? ${htmlElement.classList.contains('dark')}`);
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
  if (!dialogContent) {
    console.error("FUNC showDialogError: dialogContent element not found!");
    return;
  }
  let fullMessage = message;
  if (message.toLowerCase().includes("fetch")) {
    fullMessage += ` (Network error or issue with the server-side proxy. Check '${PROXY_ENDPOINT_URL}' implementation and logs.)`;
  } else if (message.toLowerCase().includes("timeout")) {
    fullMessage += ` (The request timed out after ${FETCH_TIMEOUT_MS / 1000} seconds.)`;
  } else if (message.toLowerCase().includes("parsing") || message.toLowerCase().includes("extract")) {
    fullMessage += " (Could not read data; the Play Store layout may have changed.)";
  }
  console.error("FUNC showDialogError:", fullMessage);
  dialogContent.innerHTML = `
    <div class="dialog-error">
      <md-icon>warning</md-icon>
      <p>${fullMessage}</p>
    </div>`;
}

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

function displayAppsInDialog(apps) {
  console.log("FUNC displayAppsInDialog: Called.");
  if (!dialogContent) {
    console.error("FUNC displayAppsInDialog: dialogContent element not found!");
    return;
  }
  if (!Array.isArray(apps) || apps.length === 0) {
    console.warn("FUNC displayAppsInDialog: No apps to display");
    showDialogError("No apps found for this developer.");
    return;
  }
  dialogContent.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'portfolio-grid';
  let cardsAdded = 0;
  apps.forEach(app => {
    const card = createAppCardElement(app);
    if (card) {
      grid.appendChild(card);
      cardsAdded++;
    }
  });
  if (cardsAdded > 0) {
    dialogContent.appendChild(grid);
    console.log(`FUNC displayAppsInDialog: App grid with ${cardsAdded} cards appended.`);
  } else {
    showDialogError("Could not create display cards for the found apps.");
  }
}

function extractJsonData(htmlContent) {
  console.log("FUNC extractJsonData: Starting extraction...");
  if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.length < 500) {
    console.error("FUNC extractJsonData: Invalid HTML content");
    throw new Error("Invalid HTML content received.");
  }
  const dataCallbackRegex = /AF_initDataCallback\s*\(\s*(\{.*?\})\s*\)\s*;/gs;
  let match, relevantJsonString = null;
  while ((match = dataCallbackRegex.exec(htmlContent)) !== null) {
    const cb = match[1];
    if (cb.includes('ds:')) {
      const dataMatch = cb.match(/data:\s*(\[.*?\])\s*,\s*sideChannel/s);
      if (dataMatch) {
        relevantJsonString = dataMatch[1];
        break;
      }
    }
  }
  if (!relevantJsonString) {
    dataCallbackRegex.lastIndex = 0;
    while ((match = dataCallbackRegex.exec(htmlContent)) !== null) {
      const cb = match[1];
      const genericMatch = cb.match(/:\s*(\[.*\])/s);
      if (genericMatch && genericMatch[1].length > 1000) {
        relevantJsonString = genericMatch[1];
        break;
      }
    }
  }
  if (!relevantJsonString) {
    console.error("FUNC extractJsonData: Failed to find JSON data");
    throw new Error("Failed to extract JSON data from HTML.");
  }
  const cleaned = relevantJsonString.replace(/undefined/g, 'null').replace(/,\s*([\]}])/g, '$1');
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Error parsing extracted data: ${e.message}`);
  }
}

function searchForApps(dataArray) {
  console.log("FUNC searchForApps: Starting...");
  const appInfos = [];
  const known = new Set();
  if (!Array.isArray(dataArray)) {
    console.error("FUNC searchForApps: Invalid data format");
    throw new Error("Invalid data format.");
  }

  function flatten(el) {
    if (typeof el === 'string') return [el];
    if (Array.isArray(el)) return el.flatMap(flatten);
    if (el && typeof el === 'object') return Object.values(el).flatMap(flatten);
    return [];
  }

  function traverse(el) {
    if (Array.isArray(el)) {
      const strings = flatten(el);
      const pkg = strings.find(s => s.startsWith('com.') && !s.includes('google'));
      if (pkg && !known.has(pkg)) {
        const icon = strings.find(s => s.startsWith('https://play-lh.googleusercontent.com/'));
        let name = typeof el[2] === 'string' ? el[2] : el[3] || strings.find(s => s !== pkg);
        const div = document.createElement('div');
        div.innerHTML = name;
        name = div.textContent || name;
        appInfos.push({
          name: name.trim(),
          iconUrl: icon || DEFAULT_ICON_URL,
          packageName: pkg
        });
        known.add(pkg);
      } else el.forEach(traverse);
    } else if (el && typeof el === 'object') {
      Object.values(el).forEach(traverse);
    }
  }
  dataArray.forEach(traverse);
  console.log(`FUNC searchForApps: Found ${appInfos.length} apps.`);
  return appInfos.sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchAndDisplayDeveloperApps() {
  const fn = "FUNC fetchAndDisplayDeveloperApps";
  console.log(`${fn}: Starting...`);
  if (!portfolioDialog || !dialogContent) return console.error(`${fn}: Dialog element not found`);
  try {
    portfolioDialog.show();
    console.log(`${fn}: Dialog shown.`);
    showDialogLoading();
    const proxyUrl = `${PROXY_ENDPOINT_URL}?target=${encodeURIComponent(PLAY_STORE_RAW_URL)}`;
    console.log(`${fn}: Fetching via proxy: ${proxyUrl}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(proxyUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/html'
      }
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Failed to fetch from proxy: ${response.status} ${response.statusText}`);
    const htmlContent = await response.text();
    if (htmlContent.length < 500) throw new Error("Invalid or empty response from proxy.");
    console.log(`${fn}: HTML received. Extracting data...`);
    const jsonData = extractJsonData(htmlContent);
    console.log(`${fn}: Data extracted. Searching for apps...`);
    const apps = searchForApps(jsonData);
    console.log(`${fn}: Displaying apps...`);
    displayAppsInDialog(apps);
    console.log(`${fn}: Completed successfully.`);
  } catch (error) {
    console.error(`${fn}: Error occurred:`, error);
    let msg = error.name === 'AbortError' ?
      `Request timed out after ${FETCH_TIMEOUT_MS / 1000} seconds.` :
      error.message.includes("proxy") ?
      error.message + " Please check the proxy implementation." :
      error.message;
    showDialogError(msg);
  } finally {
    console.log(`${fn}: --- Finished ---`);
  }
}

console.log("SCRIPT: Setting up event listeners...");
if (menuButton) menuButton.addEventListener('click', openDrawer);
else console.error("Menu button missing");
if (closeDrawerButton) closeDrawerButton.addEventListener('click', closeDrawer);
else console.error("Close drawer button missing");
if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
else console.error("Drawer overlay missing");
toggleSection(moreToggle, moreContent);
toggleSection(appsToggle, appsContent);
if (themeSegmentedButtonSet) {
  themeSegmentedButtonSet.addEventListener('segmented-button-set-selection', e => {
    console.log("EVENT: theme selection changed to:", e.detail?.button?.value);
    if (e.detail?.button?.value) applyTheme(e.detail.button.value);
    else console.warn("Unexpected theme event:", e.detail);
  });
} else console.error("Theme button set missing");
if (viewPortfolioButton && portfolioDialog) {
  viewPortfolioButton.addEventListener('click', () => {
    console.log("EVENT: viewPortfolioButton clicked");
    if (!portfolioDialog.open) fetchAndDisplayDeveloperApps();
  });
} else console.error("Portfolio button or dialog missing");
if (closePortfolioDialogButton && portfolioDialog) {
  closePortfolioDialogButton.addEventListener('click', () => portfolioDialog.close("closed-by-button"));
} else console.error("Portfolio close button or dialog missing");

document.addEventListener('DOMContentLoaded', () => {
  console.log("EVENT: DOMContentLoaded - Applying initial theme...");
  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme || 'auto';
  applyTheme(initialTheme);
  if (themeSegmentedButtonSet) {
    setTimeout(() => {
      try {
        themeSegmentedButtonSet.selected = initialTheme;
      } catch (err) {
        console.error("Error setting initial theme state:", err);
      }
    }, 150);
  }
});

console.log("SCRIPT: Setting up system theme change listener...");
try {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = event => {
    console.log(`EVENT: System theme change detected (dark=${event.matches}).`);
    if (!localStorage.getItem('theme')) applyTheme('auto');
  };
  if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', handleSystemThemeChange);
  else if (mediaQuery.addListener) mediaQuery.addListener(handleSystemThemeChange);
  else console.warn("Cannot add system theme listener");
} catch (e) {
  console.error("Failed to set up system theme listener:", e);
}

let touchStartX = 0,
  touchEndX = 0,
  isPotentiallySwiping = false;
const swipeThreshold = 50,
  edgeThreshold = 40;
console.log("SCRIPT: Initializing swipe detection for drawer...");
body.addEventListener('touchstart', e => {
  const target = e.target;
  if (navDrawer?.classList.contains('open') ||
    target.closest('md-dialog, button, a, input, textarea, select, [role=\"button\"], [data-swipe-ignore]') ||
    window.getComputedStyle(target).overflowY === 'scroll' ||
    target.closest('[style*=\"overflow\"]')) {
    isPotentiallySwiping = false;
    return;
  }
  const x = e.touches[0].clientX;
  if (x < edgeThreshold) {
    touchStartX = x;
    touchEndX = x;
    isPotentiallySwiping = true;
  }
}, {
  passive: true
});

body.addEventListener('touchmove', e => {
  if (isPotentiallySwiping) touchEndX = e.touches[0].clientX;
}, {
  passive: true
});

body.addEventListener('touchend', e => {
  if (!isPotentiallySwiping) return;
  const deltaX = touchEndX - touchStartX;
  if (deltaX > swipeThreshold) {
    const endTarget = document.elementFromPoint(touchEndX, e.changedTouches[0].clientY);
    if (!endTarget?.closest('button, a, input, textarea, select, [role=\"button\"]')) {
      console.log(`EVENT touchend: Right swipe detected (deltaX=${deltaX}), opening drawer.`);
      openDrawer();
    }
  }
  isPotentiallySwiping = false;
});

console.log("SCRIPT END: main.js parsed and executed.");