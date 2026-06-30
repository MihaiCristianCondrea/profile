import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const distDir = new URL('../dist/', import.meta.url);
const read = (path) => readFileSync(new URL(path, distDir), 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

assert(existsSync(distDir), 'dist directory is missing; run npm run build first.');

const html = read('index.html');
assert(/<link[^>]+href="\.\/assets\/index-[^"]+\.css"/.test(html), 'production CSS link must be emitted as a relative ./assets URL.');
assert(/<script[^>]+src="\.\/assets\/index-[^"]+\.js"/.test(html), 'production module script must be emitted as a relative ./assets URL.');
assert(!html.includes('href="/profile/assets/'), 'production CSS must not require the /profile/ deployment base.');
assert(!html.includes('src="/profile/assets/'), 'production module script must not require the /profile/ deployment base.');

const assetFiles = readdirSync(new URL('assets/', distDir));
const cssFile = assetFiles.find((file) => /^index-.*\.css$/.test(file));
assert(cssFile, 'main CSS asset is missing from dist/assets.');

const css = read(join('assets', cssFile));
assert(css.includes('.material-symbols-outlined'), 'Material Symbols class is missing from bundled CSS.');
assert(css.includes('font-family:Material Symbols Outlined') || css.includes('Material Symbols Outlined'), 'Material Symbols font family is missing from bundled CSS.');
assert(css.includes('#resumePage #resume-preview'), 'resume preview styles are missing from bundled CSS.');
assert(css.includes('@media print'), 'print media rules are missing from bundled CSS.');
assert(css.includes('#resumePage .form-container,#resumePage .resume-download,#resumePage .resume-json-actions,#resumePage .no-print{display:none!important}') || css.includes('#resumePage .form-container') && css.includes('@media print'), 'print-only hiding rules for resume controls are missing.');
assert(css.includes('@page{size:A4 portrait;margin:0}'), 'print CSS must use A4 with zero page margins for full-page resume output.');
assert(!css.includes('size:A3'), 'print CSS must not include an A3 fallback.');
assert(css.includes('justify-content:center!important') && css.includes('#resumePage #resume-preview') && css.includes('margin:0!important'), 'print CSS must remove print margins around the resume preview.');
assert(css.includes('-webkit-print-color-adjust:exact') && css.includes('print-color-adjust:exact'), 'print CSS must preserve background colors for PDF output.');
assert(!css.includes('html2canvas') && !css.includes('jspdf'), 'production CSS must not indicate a canvas/image PDF export path.');

const resumeHtml = read('content/features/resume/presentation/resume.html');
assert(resumeHtml.includes('id="resume-preview"'), 'resume page fragment is missing the preview container.');
assert(resumeHtml.includes('id="downloadResumeButton"'), 'resume page fragment is missing the download/print button.');

const resumeJs = read('assets/js/features/resume/presentation/ResumePage.js');
assert(resumeJs.includes("style.textContent = '@page { size: A4 portrait; margin: 0; }';"), 'resume print preparation must inject A4 zero-margin @page sizing.');
assert(!resumeJs.includes('A3'), 'resume print preparation must not include the old A3 fallback.');
assert(resumeJs.includes('window.print()'), 'resume export must continue to use browser print, not canvas/image PDF generation.');
assert(!resumeJs.includes('html2canvas') && !resumeJs.includes('jsPDF'), 'resume export must not use html2canvas/jsPDF.');

console.log(`Verified production assets: ${cssFile}`);
