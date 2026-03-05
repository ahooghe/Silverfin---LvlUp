# Changelog

All notable changes to this project will be documented in this file.

> **Note:** Changes prior to version 0.1.2 were not tracked in this changelog.

## [1.0.0] - 05/03/2026
### Added
- Real-time diagnostics with error/warning squiggles for Silverfin templates.
- Block matching, tag completeness, translation validation, IC/NIC nesting checks, and more.
- Quick fixes: lightbulb suggestions for tag typos and invalid input types using Levenshtein distance matching.
- Auto-fix on save: high-confidence typo corrections (distance 1, unambiguous) are applied automatically on save.
- Go to Definition: Ctrl+click on variables to jump to their assign/capture definition across text parts and shared parts.
- Include navigation: Ctrl+click on `{% include "shared/..." %}` or `{% include "part/..." %}` to open the target file.
- Custom folding ranges for Liquid, markdown, and HTML blocks.
- Format on save re-enabled for Silverfin files.

### Changed
- Refactored large source files into modular directory structures.
- Theme no longer forced on activation; Silverfin token colors are injected as scoped defaults, working on any theme.

### Fixed
- Multi-line `{% ic %}` blocks no longer collapsed to one line.
- Structural markdown tags (`{::infotext}`, `{::group}`, etc.) always format at column 0.

---

## [0.2.1] - 03/03/2026
### Fixed
- **Formatter:** `{% linkto %}` blocks are now always kept on a single line.
- **Formatter:** `{::` markdown tags inside `{% ic %}` / `{% nic %}` blocks are now preserved correctly.
- **Formatter:** IC block line joiner no longer merges words across joined lines.
- **Formatter:** `{::` / `{:/` markdown tags now indent to their correct nesting level.
- **Formatter:** Multi-line markdown blocks at root level are no longer collapsed into a single line.
- **Formatter:** Removed trailing whitespace in IC block content.

---

## [0.2.0] - 02/03/2026
### Added

#### Activity Bar & CLI Integration
- Upgraded Development and CLI Information panels from tree views to rich webview UIs with styled buttons and layout.
- CLI version detection with automatic update-available notifications and one-click update.
- Environment management: add, remove, toggle production flag, and set active environment from the sidebar.
- Auto-seeding of environments from the Silverfin CLI configuration file.
- Production guard: confirmation prompt when performing CLI operations against production environments.
- Create Reconciliation command with simple setup and full wizard modes.
- Create Shared Part command via the activity bar.
- Extension settings: `cliConfigPath` for custom CLI config location, `environments` list, and `activeEnvironment` selection.

#### Snippets
- New snippet: `forimanual` — manual fori loop with add row button.
- New snippet: `addnewrowbutton` — add new row button for manual fori loops.
- New snippet: `infotexthover` — hover-style infotext block.
- New snippets: `cautiontext`, `cautiontextblock`, `cautiontexthover` — cautiontext blocks in all variants.
- New snippet: `font` — markdown font size tag with size options (xxs–xl).
- New snippet: `indent` — markdown indent tag with level parameter.
- New snippet: `inputvalidationexclusive` — input validation with exclusive bounds.
- New snippet: `stringvalidation` — string length validation (min/max length).
- New snippet: `patternvalidation` — regex pattern validation with custom error message.

#### Hover Documentation (Dictionary)
- Added input attributes: `assign`, `assign_option`, `import_title`, `invert`.
- Added file input attributes: `show_label`, `document`, `documents`, `external_links`.
- Added `manual` attribute documentation for `fori` loops.
- Added `add_new_row_button` tag with `text` and `target` attributes.
- Added hover docs for `infotext`, `cautiontext`, and `warningtext` markdown-style tags.
- Added hover docs for `colspan` and `rowspan` HTML attributes.
- Added hover docs for `::font` and `::indent` markdown styling tags.
- Expanded `input_validation` documentation with `min_exclusive`, `max_exclusive`, `min_length`, `max_length`, `pattern`, `pattern_flags`, and `validation_text` attributes.

### Changed
- Updated `inputvalidation` snippet: removed deprecated `as:` parameter, split into inclusive and exclusive variants.
- Updated `datevalidation` snippet: removed unnecessary `as:date` prefix.
- Removed deprecated `as` attribute from `input_validation` hover documentation.
- Confirmation dialog now required before updating all reconciliations.

### Fixed
- Capture block formatting: content is now preserved exactly as-is with only leading indentation adjusted.
- Single-line capture blocks (`{% capture %}...{% endcapture %}` on one line) are now handled correctly by the formatter.
- `add_new_row_button` is now recognized as a single-line tag by the formatter (no longer causes indentation issues).

---

## [0.1.5] - 26/10/2025
### Added
- Complete activity bar interface with three main views: Template Information, Development Actions, and CLI Integration.
- Smart template detection for reconciliation templates and shared parts with appropriate tooling for each type.
- Interactive configuration management: toggle boolean settings, edit values, and change reconciliation types directly from sidebar.
- Automated shared parts management: one-click addition of shared parts found in template files to Silverfin project.
- Text parts automation: automatically scan and add text part includes to config.json file.
- Background CLI command execution with real-time output logging in dedicated output channel.

### Changed
- Updated all code snippets to use double quotes instead of single quotes for improved usability and consistency.
- Major code cleanup and refactoring of activity bar code with comprehensive JSDoc documentation and improved organization.
- Enhanced code structure following project coding style guidelines for better maintainability.

### Fixed
- Capture block formatting issues that were causing unwanted content modifications during code formatting.

---

## [0.1.4] - 19/07/2025
### Added

### Changed
- Complete rewrite of formatting logic to increase formatting speed

### Fixed
- Markdown handling in formatter

---

## [0.1.3] - 14/07/2025
### Added
- New feature: When code is selected, you can surround it with quotes, double quotes, square brackets, curly brackets, normal brackets, or percentage signs by pressing the corresponding key.
- Added command: Pressing `Ctrl+Shift+/` surrounds the selected code with Liquid comment tags (`{% comment %} ... {% endcomment %}`).
- Implemented smart space insertion: When the cursor is between `{%|%}` or `{{|}}` and you press space, two spaces are inserted and the cursor is placed between them for more comfortable Liquid editing.
- Added automatic empty line padding after closing tags to enhance readability.
- Added translation definition tags with optional secondary language support.

### Changed
- Formatter updated to remove all padding from Markdown lines. This emergency patch aims to resolve issues caused by padding when using the code interpreter. (Still under testing)
- Removed 1 indentation level for `when`, `else`, and `elsif` tags to match standard Liquid formatting conventions.

### Fixed
- Add 'blank' to boolean keywords and enhance variable matching pattern.

---

## [0.1.2] - 08/07/2025
### Added
- Initial `CHANGELOG.md` and `FAQ.md` files.
- New `FEATURES.md` to document extension capabilities.
- Additional table snippets for `forloop` and `foriloop`, including `stripnewlines` support.
- Config file (JSON) syntax highlighting.
- Formatter for Liquid code, supporting indentation for Liquid blocks.
- HTML formatting support: HTML block tags are now indented in sync with Liquid blocks.
- Enhanced formatter to treat HTML and Liquid blocks as a unified context for indentation.
- Additional block support in the Liquid formatter for more robust formatting.

### Changed
- Major updates to `README.md` for clarity and improved feature descriptions.
- Improved formatting and readability for HTML and table snippets.
- Refined Silverfin color theme name.
- Cleaned up and refactored formatter code structure for maintainability.

### Fixed
- Enhanced Silverfin syntax patterns for better matching and escape character handling.
- Fixed highlighting for `endnic` and curly braces within opening/closing tags.
- Improved Silverfin and additional highlighting.

---