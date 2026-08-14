# Read-only reference projects

The `resources/` directory contains external source used for research and
comparison. It is not part of this application's runtime.

Current references include:

- `resources/github_dev_tools`, the feature-first TypeScript and UI/UX model;
- `resources/material-web-components`, the Material Web 2.4.1 source snapshot.

Reference content may be inspected to understand architecture, component APIs,
events, slots, tokens, and interaction patterns. It must never be edited,
imported by production code, bundled by Vite, or treated as generated output.

## Reference manifests are renamed on purpose

The one deliberate exception to "never edited" is that the snapshots' own npm
manifests are stored as `package.reference.json` rather than `package.json`:

- `resources/material-web-components/package.reference.json`
- `resources/material-web-components/catalog/package.reference.json`

Their contents are untouched. GitHub's dependency graph picks up every file
named `package.json` anywhere in the repository, so these two raised Dependabot
alerts for build tooling that this project never installs, builds, or ships —
`npm audit` at the root cannot even see them. Renaming keeps the versions
readable while removing the phantom alerts. Do not rename them back.

Adapt useful principles deliberately into this repository's own `src/`, tests,
or documentation. The production dependency remains `@material/web` from npm,
and the production source of truth remains `src/`.
