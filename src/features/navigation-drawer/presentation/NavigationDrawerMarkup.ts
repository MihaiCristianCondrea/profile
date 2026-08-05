export const NAVIGATION_DRAWER_MARKUP = `
  <md-navigation-drawer-modal
    id="navDrawer"
    class="drawer"
    pivot="start"
    aria-label="Site navigation"
    aria-modal="true"
  >
    <div class="drawer-header">
      <h2>Menu</h2>
      <md-icon-button id="closeDrawerButton" type="button" aria-label="Close menu">
        <md-icon>close</md-icon>
      </md-icon-button>
    </div>
    <div class="drawer-body">
      <div class="drawer-content">
        <md-item id="navHomeLink" class="nav-item" href="#home" role="link" tabindex="0">
          <span class="nav-item-container" slot="container" aria-hidden="true"></span>
          <md-icon slot="start">home</md-icon>
          Home
        </md-item>
        <md-item
          class="nav-item"
          href="https://d4rk7355608.blogspot.com/"
          target="_blank"
          role="link"
          tabindex="0"
        >
          <span class="nav-item-container" slot="container" aria-hidden="true"></span>
          <md-icon slot="start">article</md-icon>
          Blogs
          <md-icon slot="end">open_in_new</md-icon>
        </md-item>
        <md-item id="navSongsLink" class="nav-item" href="#songs" role="link" tabindex="0">
          <span class="nav-item-container" slot="container" aria-hidden="true"></span>
          <md-icon slot="start">music_note</md-icon>
          Music
        </md-item>
        <md-item id="navProjectsLink" class="nav-item" href="#projects" role="link" tabindex="0">
          <span class="nav-item-container" slot="container" aria-hidden="true"></span>
          <md-icon slot="start">work</md-icon>
          Projects
        </md-item>
        <md-item id="navFaqsLink" class="nav-item" href="#faqs" role="link" tabindex="0">
          <span class="nav-item-container" slot="container" aria-hidden="true"></span>
          <md-icon slot="start">quiz</md-icon>
          FAQ &amp; Support
        </md-item>
        <md-item id="navContactLink" class="nav-item" href="#contact" role="link" tabindex="0">
          <span class="nav-item-container" slot="container" aria-hidden="true"></span>
          <md-icon slot="start">contact_mail</md-icon>
          Contact
        </md-item>
        <md-item id="navAboutMeLink" class="nav-item" href="#about-me" role="link" tabindex="0">
          <span class="nav-item-container" slot="container" aria-hidden="true"></span>
          <md-icon slot="start">person</md-icon>
          About Me
        </md-item>
        <md-item
          id="navSmartCleanerLink"
          class="nav-item"
          href="#smart-cleaner-for-android"
          role="link"
          tabindex="0"
        >
          <span class="nav-item-container" slot="container" aria-hidden="true"></span>
          <md-icon slot="start">cleaning_services</md-icon>
          Smart Cleaner for Android
        </md-item>
        <md-item
          id="navAdsHelpCenterLink"
          class="nav-item"
          href="#ads-help-center"
          role="link"
          tabindex="0"
        >
          <span class="nav-item-container" slot="container" aria-hidden="true"></span>
          <md-icon slot="start">ads_click</md-icon>
          Ads Help Center
        </md-item>
        <md-item
          class="nav-item"
          href="#privacy-policy-end-user-software"
          role="link"
          tabindex="0"
        >
          <span class="nav-item-container" slot="container" aria-hidden="true"></span>
          <md-icon slot="start">privacy_tip</md-icon>
          App Privacy Policy
        </md-item>
        <md-item
          class="nav-item"
          href="#terms-of-service-end-user-software"
          role="link"
          tabindex="0"
        >
          <span class="nav-item-container" slot="container" aria-hidden="true"></span>
          <md-icon slot="start">gavel</md-icon>
          Terms of Service
        </md-item>
        <md-item
          id="navLegalNoticesLink"
          class="nav-item"
          href="#legal-notices"
          role="link"
          tabindex="0"
        >
          <span class="nav-item-container" slot="container" aria-hidden="true"></span>
          <md-icon slot="start">policy</md-icon>
          Legal Notices
        </md-item>
      </div>
      <div class="drawer-footer" aria-label="Theme and legal settings">
        <p class="drawer-footer-label">Theme</p>
        <div class="theme-options" role="group" aria-label="Theme options">
          <md-icon-button
            id="lightThemeButton"
            class="theme-option"
            type="button"
            aria-label="Light theme"
            data-theme="light"
          >
            <md-icon>light_mode</md-icon>
          </md-icon-button>
          <md-icon-button
            id="darkThemeButton"
            class="theme-option"
            type="button"
            aria-label="Dark theme"
            data-theme="dark"
          >
            <md-icon>dark_mode</md-icon>
          </md-icon-button>
          <md-icon-button
            id="autoThemeButton"
            class="theme-option"
            type="button"
            aria-label="Auto theme"
            data-theme="auto"
          >
            <md-icon>brightness_auto</md-icon>
          </md-icon-button>
        </div>
        <div class="drawer-links">
          <a href="#privacy-policy">Privacy Policy</a>
          <span aria-hidden="true">·</span>
          <a href="#code-of-conduct">Code of Conduct</a>
        </div>
      </div>
    </div>
  </md-navigation-drawer-modal>
`;
