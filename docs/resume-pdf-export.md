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


## ATS compatibility requirements

The Resume Builder is intended to produce professional resumes that can be uploaded to LinkedIn, Workday, Greenhouse, Lever, SmartRecruiters, Taleo, Indeed, and other Applicant Tracking Systems. The exported PDF must maximize machine readability.

1. Preserve real text: never rasterize the document, render through canvas, or export image-only PDFs.
2. Keep logical reading order: DOM order should match the intended reading order, while recognizing that each browser PDF engine may emit PDF content streams differently.
3. Embed fonts: wait for browser font loading before print and verify extracted text still returns Unicode characters correctly.
4. Use semantic HTML: use `h1` for the candidate name, `h2` for major sections, `ul`/`li` for skills and bullet lists, `address` for contact details, and `time` for dates when possible.
5. Avoid meaningful text inside SVG, canvas, images, CSS pseudo-elements, or icon fonts.
6. Treat icons as decorative only; every meaningful detail must also be present as real text.
7. Keep layout simple: avoid nested tables, unnecessary absolute positioning, overlapping elements, and text transforms that interfere with extraction.
8. Verify extraction after generating a PDF by copying all text into a plain text editor and checking order, Romanian diacritics, and Unicode characters.
9. Validate with real parsers, including LinkedIn Resume Import, Resume Worded, Jobscan, and resume parser APIs; compare extracted names, contact details, job titles, companies, dates, skills, and education with the source data.
10. Keep accessibility aligned with ATS needs: correct heading hierarchy, language metadata, and no reliance on color alone.

## Validation strategy

Do not treat “main resume content first in DOM order” as a guaranteed ATS improvement without testing. It is a sensible accessibility and extraction hypothesis, but ATS parsers commonly work from PDF text extraction, and the emitted PDF content stream can be influenced by the browser PDF generator.

Build a small regression corpus before changing layout assumptions: generate representative CVs in English and Romanian, export them with the supported browser print path, run plain-text extraction, then compare parser output from LinkedIn, Jobscan, Resume Worded, and parser APIs against the original structured data.
