# ✨ Features — Silverfin: Level-Up

**Transform your VS Code into a Silverfin powerhouse!**  
Here's everything you get with **Silverfin: Level-Up** for Visual Studio Code:

---

## 🚀 Core Features at a Glance

✅ **80+ Smart Snippets** for every Silverfin scenario  
✅ **Intelligent Auto-completion** with hover documentation  
✅ **One-click Formatting** for clean, readable code  
✅ **Real-time Diagnostics** with error and warning squiggles  
✅ **Quick Fixes** with auto-correction for typos on save  
✅ **Go to Definition** with Ctrl+click on variables and includes  
✅ **Custom Code Folding** for Liquid, markdown, and HTML blocks  
✅ **Format on Save** enabled by default  
✅ **Custom Syntax Highlighting** with Silverfin-specific theme  
✅ **Complete Activity Bar Interface** with template & environment management  
✅ **CLI Integration** with version detection, updates, and environment switching  
✅ **Production Guard** to protect live environments from accidental pushes  
✅ **Advanced Input Types** including validation and dynamic inputs 

---

##  Beautiful, Custom Syntax Highlighting

- **Custom Silverfin theme:**  
  Instantly see the difference between Liquid, HTML, and Silverfin-specific tags.
- **One-click formatting:**  
  Smart auto-indentation for your entire Silverfin/Liquid document.
- **Unified block handling:**  
  HTML and Liquid blocks are formatted together for clean, readable code.

---

## 🔥 Quick Reference

### Most Used Snippets
- `input` → Basic input field
- `assign` → Variable creation  
- `capture` → Variable capture
- `if` → Conditional statement
- `for` → Loop through collections
- `locale` → Language-specific content

### Keyboard Shortcuts
- `Shift+Alt+F` → Format document
- `Ctrl+Shift+/` → Surround with comment

---

## ⚡ Smart Snippets & Autocomplete

- **90+ ready-to-use snippets:**  
  From basic input fields to complex adjustment transactions, validation rules, cautiontext/infotext blocks, and markdown styling.
- **Intelligent prefix system:**  
  Type `input`, `if`, `adjustment`, `locale`,... for instant code generation.
- **Context-aware suggestions:**  
  Get smart completions for Silverfin tags, filters, and variables as you type.
- **Dot-notation navigation:**  
  Quickly access nested properties and methods with intuitive suggestions.
- **Surround selection magic:**  
  Select code and press `"`, `'`, `[`, `{`, `(`, or `%` to instantly wrap your selection.
- **Quick Liquid comment wrapping:**  
  Press `Ctrl+Shift+/` to surround the selected code with `{% comment %} ... {% endcomment %}`.

---

## 🧠 Hover Documentation

- **Instant help:**  
  Hover over any Silverfin tag, filter, or object to see clear explanations and usage tips.
- **Examples included:**  
  Many hovers show real code examples, so you can learn by doing.

---

## 🛠️ Silverfin Data Model Integration

- **Auto-complete for Silverfin’s data model:**  
  Get suggestions for objects, properties, and methods—no more guessing or searching docs.
- **Jump between related fields:**  
  Navigate complex templates with ease.

---

## 📊 Activity Bar — Your Silverfin Command Center

**Smart template detection and management right in your sidebar!**

### 📊 Template Information View
- **Auto-detection:** Instantly recognizes reconciliation templates and shared parts
- **Configuration display:** Shows template handle, names (multilingual), virtual account numbers
- **Template type indicator:** Clear visual distinction between reconciliation templates and shared parts
- **File structure:** Overview of main files and text parts

### ⚡ Development Actions View
- **Rich webview UI:** Styled action buttons organized by category (Template Actions & Bulk Actions)
- **Context-aware buttons:** Different actions based on template type
- **Sync Template:** One-click synchronization with Silverfin CLI
- **Create Reconciliation:** Simple setup or full wizard with multilingual names and type selection
- **Create Shared Part:** Quick shared part scaffolding via CLI
- **Update All Reconciliations:** Bulk update functionality with confirmation dialog
- **Add Shared Parts:** Automatically detect and add shared parts to your template
- **Background execution:** All CLI commands run in the background with real-time output

### 🌐 CLI Information & Environment Management
- **CLI version detection:** Automatically detects installed Silverfin CLI version
- **Update notifications:** Visual indicator when a CLI update is available, with one-click update
- **Environment management:** Add, remove, and organize your Silverfin environments
- **Active environment switching:** Set active environment directly from the sidebar
- **Production flag:** Mark environments as production with visual PROD badge
- **Authorization status:** See which environments are authorized in the CLI
- **Auto-seeding:** Environments are automatically imported from your CLI configuration
- **Production guard:** Confirmation prompt when pushing to production environments

### 🔧 Interactive Configuration Management
- **Toggle settings:** Click to enable/disable boolean configuration options
- **Edit values:** Modify reconciliation types, auto-hide formulas, and other settings
- **Text parts automation:** Scan template files and automatically add text parts to config.json
- **Real-time updates:** Changes are immediately reflected in your files

### ⚙️ Extension Settings
- **`silverfinLvlUp.cliConfigPath`:** Custom path to the Silverfin CLI config file
- **`silverfinLvlUp.environments`:** List of configured Silverfin environments
- **`silverfinLvlUp.activeEnvironment`:** Currently active environment firm ID

---

## 🔍 Real-time Diagnostics

- **Error squiggles:**
  Catch mistakes as you type — unmatched blocks, incomplete tags, syntax issues, and more are highlighted directly in your editor.
- **Block matching:**
  Detects unclosed or orphan Liquid tags (`{% if %}`, `{% for %}`, `{% ic %}`, ...), markdown tags (`{::infotext}`, `{::group}`, ...), and HTML tags (`<table>`, `<tr>`, ...).
- **Tag completeness:**
  Flags incomplete tags like `{% assign x = %}`, `{% for in items %}`, `{% rollforward target %}`, `{% input as:select %}` without a field path, and more.
- **Translation validation:**
  `{% t %}` requires a key, `{% t= %}` requires a key and at least one language definition.
- **Input type validation:**
  Flags invalid `as:` types on `{% input %}` tags.
- **Smart warnings:**
  Empty block bodies, duplicate result names (scope-aware), nested IC/NIC blocks, empty comments, and dangling comparison operators.
- **Quick fixes:**
  Lightbulb suggestions for misspelled tags (`{% asign %}` -> `{% assign %}`) and invalid input types (`as:boolan` -> `as:boolean`), powered by Levenshtein distance matching.
- **Auto-fix on save:**
  High-confidence typo corrections (single-character mistakes with only one possible match) are applied automatically when you save.

---

## 🔗 Go to Definition & Include Navigation

- **Variable definitions:**
  Ctrl+click on any variable to jump to its `{% assign %}` or `{% capture %}` definition — searches the current file, other text parts, and included shared parts.
- **Include navigation:**
  Ctrl+click on `{% include "shared/handle" %}` or `{% include "part/name" %}` to open the target file directly.
- **Linear-aware:**
  Definitions are sorted closest-first, with same-file definitions prioritized.

---

## 📁 Custom Code Folding

- **Liquid blocks:**
  Fold `{% if %}...{% endif %}`, `{% for %}...{% endfor %}`, `{% capture %}...{% endcapture %}`, and all other block pairs.
- **Markdown blocks:**
  Fold `{::infotext}...{:/infotext}`, `{::group}...{:/group}`, and other markdown-style blocks.
- **HTML blocks:**
  Fold `<table>...</table>`, `<tr>...</tr>`, and other HTML block tags.
- **Comments:**
  `{% comment %}...{% endcomment %}` blocks fold with the comment style.

---

## 🎨 Theme-Friendly Syntax Highlighting

- **Works with any theme:**
  Silverfin-specific token colors are injected as scoped defaults — your preferred VS Code theme stays untouched.
- **Optional custom theme:**
  The bundled Silverfin dark and light themes are still available if you prefer a fully tailored look.

---

## 🏗️ HTML & Liquid Support

- **HTML-in-Liquid snippets:**  
  Insert tables, rows, and more with a keystroke; customized for Silverfin’s needs.
- **Auto-closing tags:**  
  Write HTML and Liquid faster with automatic closing for tags and brackets.

---

## 🧹 One-Click Formatting for Liquid & HTML

- **Smart auto-indentation:**  
  Format your entire Silverfin/Liquid document with a single command.
- **Unified block handling:**  
  HTML and Liquid blocks are indented together for clean, readable code.
- **Supports nested and mixed content:**  
  Works seamlessly with complex templates containing both HTML and Liquid.
- **Handles additional Liquid blocks:**  
  Improved support for more Liquid block types and robust formatting.

---

## 📝 Config File Highlighting

- **Consistent colors for config files:**  
  Your JSON config files are highlighted with the same Silverfin palette, making them easy to scan and edit.

---

## 👀 Theme for All Your Silverfin Work

- **One-click theme activation:**  
  Instantly switch to the Silverfin theme for a consistent look across all your Silverfin projects.

---

## 💡 Designed for Everyone

- **Beginner-friendly:**  
  Clear explanations, helpful tooltips, and easy-to-use snippets.
- **Powerful for experts:**  
  Advanced completions, deep data model integration, and customizable snippets.

---

## ▶️ Getting Started is Easy

1. **Install** Silverfin: Level-Up from the VS Code Marketplace.
2. **Open any `.liquid` file**—the extension activates automatically.
3. **Start coding!**  
   Enjoy a smarter, faster, and friendlier Silverfin experience.

---

Have questions or ideas?  
Check the [README](./README.md) or [open an issue](https://github.com/ahooghe/Silverfin---LvlUp/issues).

---

*Silverfin: Level-Up — Make Silverfin development a joy, not a chore.*