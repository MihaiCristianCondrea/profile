(function () {
  'use strict'; 
  const htmlElement = document.documentElement; 
  const body = document.body;
  const menuButton = document.getElementById('menuButton');
  const navDrawer = document.getElementById('navDrawer');
  const closeDrawerButton = document.getElementById('closeDrawerButton');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const moreToggle = document.getElementById('moreToggle');
  const moreContent = document.getElementById('moreContent');
  const appsToggle = document.getElementById('appsToggle');
  const appsContent = document.getElementById('appsContent');
  const themeSegmentedButtonSet = document.getElementById('themeSegmentedButtonSet');
  function openDrawer() {
    if (navDrawer && drawerOverlay) {
      navDrawer.classList.add('open');
      drawerOverlay.classList.add('open');
      body.style.overflow = 'hidden'; 
    } else {
      console.error('Drawer or overlay element not found for opening.');
    }
  }
  function closeDrawer() {
    if (navDrawer && drawerOverlay) {
      navDrawer.classList.remove('open');
      drawerOverlay.classList.remove('open');
      body.style.overflow = ''; 
    } else {
      console.error('Drawer or overlay element not found for closing.');
    }
  }
  function setupToggleSection(toggleButton, contentElement) {
    if (!toggleButton || !contentElement) {
      console.error(`Missing toggle button or content element for section setup.`);
      return;
    }
    contentElement.setAttribute('aria-hidden', !contentElement.classList.contains('open'));
    toggleButton.addEventListener('click', () => {
      const isOpening = !contentElement.classList.contains('open');
      const otherContent = contentElement.id === 'moreContent' ? appsContent : moreContent;
      const otherToggle = contentElement.id === 'moreContent' ? appsToggle : moreToggle;
      if (isOpening && otherContent?.classList.contains('open')) {
        otherContent.classList.remove('open');
        otherContent.setAttribute('aria-hidden', 'true');
        otherToggle?.setAttribute('aria-expanded', 'false');
      }
      contentElement.classList.toggle('open', isOpening);
      contentElement.setAttribute('aria-hidden', !isOpening);
      toggleButton.setAttribute('aria-expanded', isOpening);
    });
  }
  function applyTheme(theme) {
    htmlElement.classList.remove('dark'); 
    let effectiveTheme = theme; 
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (theme === 'light') {
      localStorage.setItem('theme', 'light');
    } else { 
      effectiveTheme = 'auto'; 
      localStorage.removeItem('theme'); 
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        htmlElement.classList.add('dark');
      }
    }
    if (themeSegmentedButtonSet) {
       try {
          const buttonToSelect = themeSegmentedButtonSet.querySelector(`md-segmented-button[value="${effectiveTheme}"]`);
          if (buttonToSelect) {
             themeSegmentedButtonSet.select(buttonToSelect);
          } else {
             console.warn(`Could not find theme button with value: ${effectiveTheme}`);
          }
       } catch (error) {
          console.error('Error updating theme segmented button state:', error);
       }
    }
  }
  let touchStartX = 0;
  let touchEndX = 0;
  let isPotentiallySwiping = false;
  const SWIPE_THRESHOLD = 50; 
  const EDGE_THRESHOLD = 40; 
  function handleTouchStart(e) {
    const target = e.target;
    if (navDrawer?.classList.contains('open') ||
        target.closest('md-dialog, button, a, input, textarea, select, [role="button"], [data-swipe-ignore]') ||
        window.getComputedStyle(target).overflowY === 'scroll' ||
        target.closest('[style*="overflow"]')) 
    {
      isPotentiallySwiping = false;
      return;
    }
    const x = e.touches[0].clientX;
    if (x < EDGE_THRESHOLD) {
      touchStartX = x;
      touchEndX = x; 
      isPotentiallySwiping = true;
    } else {
      isPotentiallySwiping = false;
    }
  }
  function handleTouchMove(e) {
    if (isPotentiallySwiping) {
      touchEndX = e.touches[0].clientX;
    }
  }
  function handleTouchEnd(e) {
    if (!isPotentiallySwiping) return;
    const deltaX = touchEndX - touchStartX;
    if (deltaX > SWIPE_THRESHOLD) {
         openDrawer();
    }
    isPotentiallySwiping = false;
    touchStartX = 0;
    touchEndX = 0;
  }
  if (menuButton) {
    menuButton.addEventListener('click', openDrawer);
  } else {
    console.error('Menu button not found.');
  }
  if (closeDrawerButton) {
    closeDrawerButton.addEventListener('click', closeDrawer);
  } else {
    console.error('Close drawer button not found.');
  }
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
  } else {
    console.error('Drawer overlay not found.');
  }
  setupToggleSection(moreToggle, moreContent);
  setupToggleSection(appsToggle, appsContent);
  if (themeSegmentedButtonSet) {
    themeSegmentedButtonSet.addEventListener('selection-change', (e) => { 
       const selectedButton = e.target.selected; 
      if (selectedButton?.value) {
        applyTheme(selectedButton.value);
      } else {
         console.warn('Theme selection change event did not provide a valid button value.');
      }
    });
  } else {
    console.error('Theme segmented button set not found.');
  }
  body.addEventListener('touchstart', handleTouchStart, { passive: true });
  body.addEventListener('touchmove', handleTouchMove, { passive: true });
  body.addEventListener('touchend', handleTouchEnd);
  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme || 'auto'; 
  applyTheme(initialTheme); 
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (event) => {
      if (!localStorage.getItem('theme')) {
        applyTheme('auto');
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if (mediaQuery.addListener) { 
      mediaQuery.addListener(handleSystemThemeChange);
    }
  } catch (e) {
    console.error('Failed to set up system theme change listener:', e);
  }
})();