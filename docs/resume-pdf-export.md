# Resume PDF export requirements

The Resume Builder must generate ATS-friendly PDFs. The exported CV must behave like a document rather than a screenshot.

## Main export path

Use browser print / Save as PDF for the primary export path. This preserves real HTML text in Chromium-generated PDFs and keeps the content selectable, searchable, and copy/paste friendly.

Do not use `html2canvas` or `jsPDF` as the main PDF export path. Those approaches commonly rasterize the resume into images. A rasterized resume may look visually correct, but ATS systems, LinkedIn import, job portals, and recruiter software can fail to parse the candidate content correctly.

## Export quality constraints

The exported CV should preserve, as much as browser print allows:

- real selectable text,
- searchable text,
- copy/paste text,
- logical reading order,
- standard fonts or embedded custom fonts,
- simple document structure,
- hyperlinks where possible.

## Design constraints

The design can still look polished, but important resume content must stay in semantic HTML:

- use normal text elements for the name, title, experience, education, skills, dates, company names, and job titles,
- keep section headings as real text,
- avoid putting important text inside images, SVGs, pseudo-elements, icon fonts, or canvas output,
- avoid multi-column complexity where possible,
- when visual columns are used, keep DOM order logical for parsing and accessibility,
- tune A4 print CSS instead of converting the preview into an image.
