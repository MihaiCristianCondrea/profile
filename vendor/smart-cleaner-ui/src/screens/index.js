// Screen registry. Each screen module exports { id, title, description, defaults, render(state) }.
import dashboard from "./dashboard.js";
import quickClean from "./quick-clean.js";
import largeFiles from "./large-files.js";
import duplicates from "./duplicates.js";
import { systemMonitor, storageMonitor } from "./system-monitor.js";
import appManager from "./app-manager.js";
import streak from "./streak.js";
import drawer from "./drawer.js";
import imageOptimizer from "./image-optimizer.js";
import galleryCleaner from "./gallery-cleaner.js";
import { feedback, howItWorks } from "./quick-clean-extras.js";
import { metadataSanitizer, fileMetadata } from "./metadata-sanitizer.js";
import { whatsappCleaner, whatsappDetails } from "./whatsapp-cleaner.js";

export const SCREENS = [dashboard, quickClean, howItWorks, feedback, galleryCleaner, largeFiles, duplicates, whatsappCleaner, whatsappDetails, storageMonitor, systemMonitor, appManager, metadataSanitizer, fileMetadata, imageOptimizer, streak, drawer];
export const byId = (id) => SCREENS.find((s) => s.id === id);
