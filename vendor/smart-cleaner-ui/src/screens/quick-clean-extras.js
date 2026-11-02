/** Mirrors QuickCleanFeedbackDialog.kt and QuickCleanInfoScreen.kt (feature/quickclean). */
import { html } from "lit";
import { previewScreen } from "material-next-web-components/marketing.js";
import { APP } from "../config/identity.js";
import { bottomAction, goer, illustration } from "../kit/components.js";
import { icon } from "../kit/shell.js";
import quickClean from "./quick-clean.js";

/** feature/quickclean: QuickCleanFeedbackDialog over the finished Quick Clean screen (the same dialog it opens). */
export const feedback = {
  ...quickClean,
  id: "feedback",
  title: "Cleanup Feedback",
  palette: "dynamic",
  description: "Rate a cleanup with Blebble faces and optional reasons.",
  defaults: { ...quickClean.defaults, phase: "done", showFeedback: true },
  controls: [],
};

const step = (ic, title, text, last) => html`<div class="sc-step">
  <div class="sc-step__rail"><span class="sc-step__dot">${icon(ic, { size: 20 })}</span>${last ? "" : html`<i></i>`}</div>
  <div style="padding-bottom:12px">
    <div class="t-title-medium w-bold" style="font-size:18px">${title}</div>
    <div class="t-body-medium c-variant">${text}</div>
  </div>
</div>`;

/** feature/quickclean: QuickCleanInfoScreen ("How it works"). */
export const howItWorks = {
  id: "how-it-works",
  title: "How Quick Clean Works",
  category: "quick-clean",
  categoryLabel: "Quick Clean",
  palette: "dynamic",
  description: "The three-step safety story and the Safety Promise.",
  defaults: {},
  render: (s) =>
    previewScreen(APP, s, {
      kind: "page",
      title: "How it works",
      scrolled: true,
      onBack: goer(s)("quick-clean", { phase: "done" }),
      content: html`<div style="padding:0 16px">
        ${illustration("il_blebble_cleaning", 190, "margin:12px auto 0")}
        <div class="t-body-large c-variant" style="font-size:17px;margin:14px 0 16px">Quick Clean clears temporary clutter while leaving your personal files alone.</div>
        ${step("frame_inspect", "Deep Scan", "Cleaner walks through your storage, looking for temporary clutter in standard junk locations.")}
        ${step("auto_fix_high", "Smart Filter", "Our engine applies your safety rules to ensure personal documents, photos, and messaging media are bypassed.")}
        ${step("done_all", "Precise Cleanup", "Only the verified junk is removed, keeping your device lean without you lifting a finger.", true)}
        <div class="sc-promise">
          <div class="sc-row" style="gap:10px">${icon("shield", { size: 24, fill: true, color: "var(--md-sys-color-primary)" })}<span class="t-title-medium w-bold c-primary" style="font-size:18px">Our Safety Promise</span></div>
          ${["Camera Photos & Videos", "Downloads Folder", "Document storage", "Messaging Backups"].map(
            (t) => html`<div class="sc-row" style="gap:12px;margin-top:10px">${icon("check", { size: 20 })}<span class="t-body-large">${t}</span></div>`,
          )}
        </div>
      </div>`,
      bottom: bottomAction("Review My Safety Rules", { icon: "settings", fill: false }),
    }),
};
