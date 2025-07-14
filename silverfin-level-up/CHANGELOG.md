# Changelog

All notable changes to this project will be documented in this file.

> **Note:** Changes prior to version 0.1.2 were not tracked in this changelog.

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