import { defineProductIdentity, supportUs, toolkitFooter } from "material-next-web-components/marketing.js";

/**
 * Smart Cleaner's identity, declared once, as app/navigation/AppGraph.kt declares cleanerGraph(): toolkitGraph(appTitle,
 * appIcon) with three tabs, the drawer's tools above toolkitFooter(), and overflow { supportUs() }. Material Next draws
 * the app bars, the navigation for each window, the drawers and the sheets from `IDENTITY.app`, and the hub from
 * `IDENTITY.product`; the assets stay in public/.
 *
 * Tab and entry ids are the marketing screens they open. Contacts cleaner, Trash and the library's pages are not drawn
 * here, so they only close the navigation.
 */
export const IDENTITY = defineProductIdentity({
  id: "smart-cleaner",
  name: "Smart Cleaner",
  // R.string.app_name: what the app calls itself in its bars and drawer.
  label: "Cleaner",
  icons: { app: "/logos/icon.svg" },
  fonts: {
    brand: { family: "Google Sans Flex", src: "fonts/GoogleSansFlex.ttf", weight: "1 1000", stretch: "25% 151%" },
    symbols: ["Material Symbols Outlined", "Material Symbols Rounded"],
  },
  colors: {
    // App Toolkit's palettes, as generated into theme/palettes.css, in picker order.
    palettes: ["captured", "dynamic", "android-vivid", "android", "blue", "green", "purple", "rose", "monochrome"],
    defaultPalette: "captured",
  },
  destinations: {
    tabs: [
      { id: "dashboard", label: "Dashboard", icon: "dashboard" },
      { id: "app-manager", label: "App Manager", icon: "app_registration" },
      { id: "system-monitor", label: "System monitor", icon: "monitor_heart" },
    ],
    drawer: {
      entries: [
        { id: "image-optimizer", label: "Image optimizer", icon: "image_search", screen: "image-optimizer" },
        { id: "metadata-sanitizer", label: "Metadata sanitizer", icon: "privacy_tip", screen: "metadata-sanitizer" },
        { id: "contacts-cleaner", label: "Contacts cleaner", icon: "contacts" },
        { id: "trash", label: "Trash", icon: "delete", badge: "1" },
      ],
      footer: toolkitFooter(),
    },
    overflow: [supportUs()],
  },
  // Marketing frames stay timeless: no clock or system icons.
  preview: { statusBar: "blank" },
});

/** The shell declaration every screen renders in: `previewScreen(APP, s, {...})`. */
export const APP = IDENTITY.app;
