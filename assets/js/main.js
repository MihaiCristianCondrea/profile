const menuButton = document.getElementById('menuButton');
const navDrawer = document.getElementById('navDrawer');
const closeDrawerButton = document.getElementById('closeDrawerButton');
const drawerOverlay = document.getElementById('drawerOverlay');
const moreToggle = document.getElementById('moreToggle');
const moreContent = document.getElementById('moreContent');
const appsToggle = document.getElementById('appsToggle');
const appsContent = document.getElementById('appsContent');
const body = document.body; // Get body element for touch events

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

body.addEventListener('touchstart', (e) => {
    // Only listen if the touch starts near the left edge and drawer isn't already open
    if (e.touches[0].clientX < edgeThreshold && !navDrawer.classList.contains('open')) {
        touchStartX = e.touches[0].clientX;
        touchEndX = touchStartX; // Initialize endX
    } else {
        touchStartX = 0; // Reset if touch starts elsewhere or drawer is open
    }
}, { passive: true }); // Use passive for better scroll performance initially

body.addEventListener('touchmove', (e) => {
    if (touchStartX === 0) return; // Exit if swipe didn't start near edge
    touchEndX = e.touches[0].clientX;
     // Optional: Could prevent vertical scroll here if swipe is clearly horizontal
     // const deltaX = touchEndX - touchStartX;
     // const deltaY = Math.abs(e.touches[0].clientY - initialTouchY); // Need to record initialTouchY in touchstart
     // if (deltaX > 10 && deltaX > deltaY * 1.5) { // If moving horizontally more than vertically
     //     e.preventDefault(); // Prevent scroll - USE WITH CAUTION, might block needed scroll
     // }
}, { passive: true }); // Generally keep move passive unless you NEED preventDefault

body.addEventListener('touchend', (e) => {
    if (touchStartX === 0) return; // Exit if swipe didn't start near edge

    const deltaX = touchEndX - touchStartX;

    if (deltaX > swipeThreshold) {
        // Check if it wasn't just a small accidental swipe (already checked deltaX > threshold)
        // Optional: add a check for vertical distance if needed to avoid conflicts
        openDrawer();
    }

    // Reset touch coordinates
    touchStartX = 0;
    touchEndX = 0;
});

// --- End Swipe Logic ---