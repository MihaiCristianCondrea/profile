# Changelog

## Unreleased

### Added

- Material Next shell with a closed desktop drawer, expandable Profile and Android Apps categories, and a shared copyright footer for 2020–2026.

### Changed

- Pin Material Next to tested source commit `ed2ce23` until npm 0.0.5 is available: the drawer is rounded again without an edge line, and the footer is the original centered 900px bar.
- Outlined top app bar and drawer with a plain **Menu** title instead of the site name, 56dp drawer destinations, and the open-in-new icon back on Blogs.
- Use shared drawer theme controls, expressive project tabs, and Android app showcase while preserving hash routes, page content, the site palette, and eight social links.
- Update compatible development dependencies to resolve two Vite security advisories.

### Fixed

- The drawer's theme picker and policy links scrolled away with the destinations; they now stay at the bottom.
- Drawer destinations had no space between them.

### Removed

- Local drawer controller and styles, copyright helper, and duplicate Android app card renderer and metadata adapter.
