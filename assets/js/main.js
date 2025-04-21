// --- Navigation Drawer Logic ---
const menuButton = document.getElementById('menuButton');
const navDrawer = document.getElementById('navDrawer');
const closeDrawerButton = document.getElementById('closeDrawerButton');
const drawerOverlay = document.getElementById('drawerOverlay');
const moreToggle = document.getElementById('moreToggle');
const moreContent = document.getElementById('moreContent');
const appsToggle = document.getElementById('appsToggle');
const appsContent = document.getElementById('appsContent');

// Function to open the drawer
function openDrawer() {
    if (navDrawer && drawerOverlay) {
        navDrawer.classList.add('open');
        drawerOverlay.classList.add('open');
    }
}

// Function to close the drawer
function closeDrawer() {
    if (navDrawer && drawerOverlay) {
        navDrawer.classList.remove('open');
        drawerOverlay.classList.remove('open');
    }
}

// Event listeners for drawer
if (menuButton) {
    menuButton.addEventListener('click', openDrawer);
}
if (closeDrawerButton) {
    closeDrawerButton.addEventListener('click', closeDrawer);
}
if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer); // Close on overlay click
}

// Event listeners for collapsible sections
function toggleSection(toggleButton, contentElement) {
    if (toggleButton && contentElement) {
        toggleButton.addEventListener('click', () => {
            const isExpanded = contentElement.classList.contains('open');
            // Close other section if open
            if (contentElement.id === 'moreContent' && appsContent.classList.contains('open')) {
                appsContent.classList.remove('open');
                appsToggle.classList.remove('expanded');
            } else if (contentElement.id === 'appsContent' && moreContent.classList.contains('open')) {
                moreContent.classList.remove('open');
                moreToggle.classList.remove('expanded');
            }
            // Toggle current section
            contentElement.classList.toggle('open', !isExpanded);
            toggleButton.classList.toggle('expanded', !isExpanded);
        });
    }
}
toggleSection(moreToggle, moreContent);
toggleSection(appsToggle, appsContent);


// --- Theme Toggle Logic ---
// Buttons are now inside the drawer
const lightThemeButton = document.getElementById('lightThemeButton');
const darkThemeButton = document.getElementById('darkThemeButton');
const autoThemeButton = document.getElementById('autoThemeButton');
const htmlElement = document.documentElement; // Target <html> element

// Function to apply theme based on preference
function applyTheme(theme) {
    if (theme === 'dark') {
        htmlElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else if (theme === 'light') {
        htmlElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else { // Auto theme
        localStorage.removeItem('theme'); // Remove preference
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
    }
    // Optional: Close drawer after selecting theme
    // closeDrawer();
}

// Event listeners for theme buttons (now list items)
if (lightThemeButton) {
    lightThemeButton.addEventListener('click', () => applyTheme('light'));
}
if (darkThemeButton) {
    darkThemeButton.addEventListener('click', () => applyTheme('dark'));
}
if (autoThemeButton) {
    autoThemeButton.addEventListener('click', () => applyTheme('auto'));
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
    // Only apply if theme is set to 'auto' (no preference saved)
    if (!localStorage.getItem('theme')) {
        if (event.matches) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
    }
});