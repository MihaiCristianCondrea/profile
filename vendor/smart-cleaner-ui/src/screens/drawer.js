/** The navigation drawer over the Dashboard: the shell's modal drawer, from the identity's entries (AppGraph.kt). */
import dashboard from "./dashboard.js";

export default {
  ...dashboard,
  id: "drawer",
  title: "Navigation Drawer",
  description: "Extra tools and app entries opened from the dashboard menu. Tap the scrim to close.",
  defaults: { ...dashboard.defaults, drawerOpen: true },
  controls: [],
};
