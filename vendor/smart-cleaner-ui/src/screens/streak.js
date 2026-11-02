/** The Dashboard with StreakDetailsBottomSheet open (feature/dashboard). */
import dashboard from "./dashboard.js";

export default {
  ...dashboard,
  id: "streak",
  title: "Weekly Clean Streak",
  description: "Streak details: current and longest streak, next milestone and milestones list.",
  defaults: { ...dashboard.defaults, showStreak: true, days: 1, progress: 0.14 },
  controls: [
    { key: "days", label: "Streak days", type: "range", min: 0, max: 30, patch: (v) => ({ progress: Math.min(1, v / 7) }) },
  ],
};
