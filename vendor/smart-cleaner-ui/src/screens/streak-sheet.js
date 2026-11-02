/** Mirrors StreakDetailsBottomSheet.kt (feature/dashboard): the sheet the Dashboard opens. */
import { html } from "lit";
import { illustration } from "../kit/components.js";
import { icon } from "../kit/shell.js";

const tile = (label, value) => html`<div class="sc-streak-tile">
  <div class="t-body-medium">${label}</div>
  <div class="t-headline-small w-bold">${value}</div>
</div>`;

const section = (ic, title) => html`<div class="sc-row" style="gap:12px;margin:20px 0 12px">
  <span class="sc-streak-badge">${icon(ic, { size: 22, fill: true })}</span><span class="t-headline-small w-bold">${title}</span>
</div>`;

/** StreakDetailsBottomSheet as an overlay for previewScreen(): `s.days` and `s.progress` describe the streak. */
export const streakSheet = (s) => ({
  presentation: "sheet",
  label: "Weekly clean streak",
  handle: true,
  flush: true,
  onDismiss: () => s.set?.({ showStreak: false }),
  content: html`<div style="padding:0 20px">
        <div class="t-headline-medium w-bold" style="text-align:center;margin-top:18px">${s.days ? `${s.days} Day Streak` : "Start your streak"}</div>
        <div class="t-body-large c-primary" style="text-align:center;margin-top:6px">“Small cleanups. Big difference.”</div>
        <div class="sc-streak-art">${illustration("il_blebble_streak", 190)}</div>
        <div class="t-body-large" style="text-align:center">You've kept your phone clean for ${s.days} consecutive day${s.days === 1 ? "" : "s"}.</div>
        <div class="sc-row" style="gap:12px;margin-top:16px">${tile("Current streak", `${s.days} day${s.days === 1 ? "" : "s"}`)} ${tile("Longest streak", `${Math.max(1, s.days)} day${Math.max(1, s.days) === 1 ? "" : "s"}`)}</div>
        <div class="sc-row" style="gap:12px;margin-top:16px">
          ${icon("emoji_events", { size: 24, fill: true, color: "#F4B400" })}<span class="t-title-medium w-semibold sc-grow">Next milestone</span
          ><span class="t-title-medium w-semibold">7 days</span>
        </div>
        <md-linear-progress class="sc-streak-progress" value=${s.progress}></md-linear-progress>
        <div class="t-body-small c-variant" style="text-align:right">${Math.round(s.progress * 100)}%</div>
        <md-divider style="margin-top:20px"></md-divider>
        ${section("calendar_month", "This week")}
        <div class="t-title-medium w-semibold">${Math.min(7, s.days)} recent streak day${Math.min(7, s.days) === 1 ? "" : "s"}</div>
        <div class="t-body-medium c-variant" style="margin-top:6px">Based on the consecutive cleanup days in your current streak.</div>
        <md-divider style="margin-top:20px"></md-divider>
        ${section("emoji_events", "Milestones")}
        <div class="sc-row" style="gap:12px;padding:6px 0">
          ${icon(s.days ? "check_circle" : "radio_button_unchecked", { size: 24, fill: !!s.days, color: s.days ? "var(--md-sys-color-primary)" : undefined })}<span class="t-body-large sc-grow">First Cleanup</span
          ><span class="t-body-small ${s.days ? "c-primary" : "c-variant"}">${s.days ? "Completed" : "Up next"}</span>
        </div>
        <div class="sc-row" style="gap:12px;padding:6px 0">
          ${icon(s.days >= 7 ? "check_circle" : "radio_button_unchecked", { size: 24, fill: s.days >= 7, color: s.days >= 7 ? "var(--md-sys-color-primary)" : undefined })}<span class="t-body-large sc-grow">7 Day Streak</span
          ><span class="t-body-small ${s.days >= 7 ? "c-primary" : "c-variant"}">${s.days >= 7 ? "Completed" : s.days ? "Up next" : "Not reached yet"}</span>
        </div>
      </div>`,
});
