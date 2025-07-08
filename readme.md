# Silverfin: Level-Up — VS Code Extension

Welcome to the **Silverfin: Level-Up** repository!  
This project powers the [Silverfin: Level-Up](https://marketplace.visualstudio.com/items?itemName=AnthonyHooghe.silverfin-level-up) extension for Visual Studio Code, designed to make Silverfin `.liquid` template development faster, smarter, and more enjoyable.

---

## 🚀 What is Silverfin: Level-Up?

Silverfin: Level-Up is a feature-rich VS Code extension that brings advanced syntax highlighting, snippets, hover documentation, auto-closing tags, and one-click formatting to Silverfin template developers.  
It’s built for both beginners and experts, with a focus on productivity, readability, and maintainability.

---

## 🛠️ Features

- **Custom Syntax Highlighting** for Liquid, HTML, and Silverfin-specific tags
- **Smart Snippets & Autocomplete** for Silverfin patterns, filters, and HTML
- **Hover Documentation** for tags, filters, and objects
- **Data Model Integration** for Silverfin’s objects and properties
- **One-Click Formatting** for unified HTML & Liquid indentation
- **Auto-closing tags** for HTML and Liquid
- **Config file highlighting** for JSON
- **Beautiful, accessible theme** for Silverfin work

See [FEATURES.md](./FEATURES.md) for a full breakdown.

---

## 📦 Repository Structure

```
silverfin-level-up/
├── src/                # Extension source code (TypeScript)
│   ├── extension.ts    # Main extension entry point
│   ├── formatter.ts    # Liquid & HTML formatter logic
│   └── ...
├── snippets/           # VS Code snippets for Silverfin & HTML
├── syntaxes/           # TextMate grammar for syntax highlighting
├── themes/             # Custom VS Code theme
├── CHANGELOG.md        # Release notes
├── FEATURES.md         # Feature overview
├── FAQ.md              # Frequently asked questions
├── README.md           # User-facing extension README
├── package.json        # Extension manifest
└── ...
```

---

## 🤝 Contributing

I welcome contributions of all kinds!  
Whether you want to fix a bug, add a feature, improve documentation, or suggest an idea, you’re in the right place.

### How to Contribute

1. **Fork this repository**
2. **Clone your fork**  
   `git clone https://github.com/your-username/Silverfin---LvlUp.git`
3. **Install dependencies**  
   `npm install`
4. **Open in VS Code**  
   `code .`
5. **Make your changes**  
   Follow the code style and add tests if needed.
6. **Test your changes**  
   Use the VS Code Extension Host (`F5`) to run and debug.
7. **Submit a Pull Request**  
   Describe your changes and reference any related issues.

### Issues & Suggestions

- [Open an issue](https://github.com/ahooghe/Silverfin---LvlUp/issues) for bugs, feature requests, or questions.
- Check the [FAQ.md](./FAQ.md) for common questions.

---

## 📝 Development Notes

- Written in TypeScript for VS Code API.
- Formatting logic is in [`src/formatter.ts`](./src/formatter.ts).
- Snippets are in [`snippets/`](./snippets/).
- Syntax highlighting is defined in [`syntaxes/silverfin.tmLanguage.json`](./syntaxes/silverfin.tmLanguage.json).
- See [`CHANGELOG.md`](./CHANGELOG.md) for recent changes.

---

## 🚧 Planned Features / Roadmap

Silverfin: Level-Up is just getting started! Here’s what’s on the horizon:

- **Error scribbles:**  
  Inline error highlighting and diagnostics for Liquid/Silverfin code.
- **Linting and quick fixes:**  
  Detect common mistakes and offer automatic corrections.
- **Automatic pipelines:**  
  Tools for updating and deploying Silverfin templates automatically.
- **Settings page:**  
  Easily configure extension options right from VS Code.
- **Light mode theme:**  
  A beautiful light theme to complement the dark mode.
- **Expanded functionality:**  
  More snippets, smarter formatting, and deeper integration with Silverfin’s platform.
- **High-level Intellisense:**  
  Even smarter completions, suggestions, and code actions.
- **Template diffing and version history:**  
  Easily compare and highlight changes between template versions.
- **In-editor documentation browser:**  
  Browse Silverfin documentation directly inside VS Code.
- **And much more!**  
  The goal is to make this extension essential for every Silverfin developer.

*Have a feature idea or suggestion?*  
Open an [issue](https://github.com/ahooghe/Silverfin---LvlUp/issues) or start a discussion!

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE.txt).

---

**Silverfin: Level-Up** —  *Make Silverfin development a joy, not a chore.*