# Read-only reference projects

The `resources/` directory contains external source used for research and
comparison. It is not part of this application's runtime.

Current references include:

- `resources/github_dev_tools`, the feature-first TypeScript and UI/UX model;
- `resources/material-web-components`, the Material Web 2.4.1 source snapshot.

Reference content may be inspected to understand architecture, component APIs,
events, slots, tokens, and interaction patterns. It must never be edited,
imported by production code, bundled by Vite, or treated as generated output.

Adapt useful principles deliberately into this repository's own `src/`, tests,
or documentation. The production dependency remains `@material/web` from npm,
and the production source of truth remains `src/`.
