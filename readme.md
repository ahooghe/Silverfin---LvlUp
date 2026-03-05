# Silverfin: Level-Up — VS Code Extension

Welcome to the **Silverfin: Level-Up** repository!  
This project powers the [Silverfin: Level-Up](https://marketplace.visualstudio.com/items?itemName=AnthonyHooghe.silverfin-level-up) extension for Visual Studio Code, designed to make Silverfin `.liquid` template development faster, smarter, and more productive with a comprehensive activity bar interface.

---

## 🚀 What is Silverfin: Level-Up?

Silverfin: Level-Up is a feature-rich VS Code extension that brings advanced syntax highlighting, snippets, hover documentation, auto-closing tags, one-click formatting, and a full CLI integration with environment management to Silverfin template developers.  
It’s built for both beginners and experts, with a focus on productivity, readability, and maintainability.

---

## 🛠️ Features

- **Real-time Diagnostics** — error and warning squiggles for block matching, tag completeness, translation validation, and more
- **Custom Syntax Highlighting** for Liquid, HTML, and Silverfin-specific tags
- **Smart Snippets & Autocomplete** for Silverfin patterns, filters, and HTML
- **Hover Documentation** for tags, filters, and objects
- **Data Model Integration** for Silverfin’s objects and properties
- **One-Click Formatting** for unified HTML & Liquid indentation
- **Activity Bar Interface** with template detection, development actions, and CLI integration
- **CLI Integration** with version detection, one-click updates, and background command execution
- **Environment Management** with add/remove, production flags, and active environment switching
- **Production Guard** to prevent accidental pushes to live environments
- **Auto-closing tags** for HTML and Liquid
- **Config file highlighting** for JSON
- **Beautiful, accessible theme** for Silverfin work

See [FEATURES.md](./FEATURES.md) for a full breakdown.

---

## 📦 Repository Structure

```
silverfin-level-up/
├── src/
│   ├── extension.ts         # Entry point
│   ├── intellisense.ts      # Hover & completion providers
│   ├── editorCommands.ts    # Editor keybinding commands
│   ├── dictionary.ts        # Hover documentation data
│   ├── silverfinDbModel.ts  # Data model for autocomplete
│   ├── activityBar/         # Sidebar UI, CLI integration & environment management
│   ├── formatter/           # Liquid & HTML formatter
│   └── diagnostics/         # Error & warning squiggles
├── snippets/                # VS Code snippets
├── syntaxes/                # TextMate grammar
├── themes/                  # Custom VS Code theme
├── CHANGELOG.md
├── FEATURES.md
├── FAQ.md
├── README.md
└── package.json
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
- Activity bar and CLI integration: `src/activityBar/`
- Formatter: `src/formatter/`
- Diagnostics: `src/diagnostics/`
- Hover documentation: `src/dictionary.ts`
- Snippets: `snippets/`
- Syntax highlighting: `syntaxes/silverfin.tmLanguage.json`
- See `CHANGELOG.md` for recent changes.

---

## 🚧 Planned Features / Roadmap

- **Document Outline:** Show template structure (assigns, captures, results, loops) in the Outline panel.
- **Unused variable detection:** Warn when assigned variables are never referenced (cross-file aware).
- **Settings page:** Configure extension options from VS Code.
- **In-editor documentation browser:** Browse Silverfin docs inside VS Code.

*Have a feature idea?* Open an [issue](https://github.com/ahooghe/Silverfin---LvlUp/issues)!

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE.txt).

---

**Silverfin: Level-Up** —  *Make Silverfin development a joy, not a chore.*