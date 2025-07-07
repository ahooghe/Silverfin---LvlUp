# Silverfin: Level-Up

**Silverfin: Level-Up** is a comprehensive Visual Studio Code extension designed to enhance your development experience with Silverfin `.liquid` templates. This extension provides advanced language support, intelligent features, and a tailored development environment for Silverfin template development.

## 🚀 Features

### 1. **Advanced Syntax Highlighting**
- Complete syntax highlighting for Silverfin `.liquid` templates using a custom TextMate grammar
- Supports all Silverfin-specific constructs including:
  - **Liquid tags**: `assign`, `capture`, `if`, `elsif`, `else`, `unless`, `for`, `fori`, `case`, `when`, `comment`, `locale`, and more
  - **Silverfin-specific tags**: `input`, `adjustmentbutton`, `currencyconfiguration`, `radiogroup`, `t` (translation)
  - **Filters**: String filters (`upcase`, `downcase`, `replace`, `remove`, `append`, `prepend`, `strip`, `capitalize`), number filters (`currency`, `integer`, `percentage`, `number_to_human`, `abs`, `ceil`, `floor`, `round`), date filters, and more
  - **HTML elements**: Full support for HTML tags with proper attribute highlighting
- Differentiated styling for tags, attributes, strings, and embedded Liquid variables
- Support for nested Liquid expressions within HTML attributes

### 2. **Intelligent Hover Documentation**
- Comprehensive hover documentation for Silverfin tags, filters, and attributes
- Detailed descriptions with examples and usage information
- Attribute-specific documentation with available options
- Database model documentation for Silverfin data objects (period, accounts, transactions, etc.)
- Smart context-aware lookups for complex object paths

### 3. **Smart Auto-Completion**
- IntelliSense completion for Silverfin database model properties
- Dot-notation completion for complex object paths (e.g., `period.accounts.`, `account.details.`)
- Context-aware suggestions based on object types
- Support for dynamic object properties and collections

### 4. **Auto-Closing Pairs**
- Automatic closing for Liquid constructs: `{%`, `{{`
- HTML tag auto-closing for common elements
- Bracket and quote auto-closing: `[`, `(`, `"`, `'`
- Smart pairing for nested structures

### 5. **Rich Code Snippets**
Three comprehensive snippet collections:
- **Core Silverfin snippets** (`silverfin.code-snippets`):
  - Input fields with various types: `input`, `inputas`, `selectinput`, `inputdefault`, `inputplaceholder`
  - Control flow: `if`, `ifelse`, `unless`, `for`, `fori`, `case`, `capture`
  - Utility tags: `assign`, `comment`, `locale`, `adjustmentbutton`, `currencyconfiguration`
- **Filter snippets** (`silverfin-filters.code-snippets`):
  - String manipulation: `split`, `append`, `upcase`, `downcase`, `replace`, `remove`
  - Number formatting: `currency`, `integer`, `percentage`, `round`, `abs`
  - Date formatting and utilities
- **HTML snippets** (`html-in-liquid.code-snippets`):
  - Common HTML elements: `p`, `br`, `hr`, `table`, `thead`, `tbody`, `tr`, `td`, `th`
  - Text formatting: `b`, `i`, `u`, `strong`, `em`
  - Links and headings: `a`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`

### 6. **Semantic Token Provider**
- Enhanced semantic highlighting for improved code readability
- Special highlighting for assignment operations and key constructs
- Type-based coloring for better visual distinction

### 7. **Custom Silverfin Theme**
- Purpose-built dark theme optimized for Silverfin development
- Distinct colors for different code elements:
  - Golden yellow (`#FFD700`) for Liquid delimiters and operators
  - Light green (`#B5E07A`) for control flow keywords
  - Purple (`#b187e7`) for utility functions and variables
  - Teal (`#2AA198`) for boolean values and assignments
- Enhanced bracket highlighting for better code structure visibility

### 8. **Comprehensive Database Model Support**
Complete IntelliSense and documentation for Silverfin's data model:
- **Period objects**: Access to fiscal year data, dates, account collections
- **Account objects**: Individual account properties, values, types, and methods
- **Transaction objects**: Transaction details, dates, relations, and custom fields
- **Collections**: Accounts drops, details drops, results drops with filtering methods
- **Navigation**: Period navigation (`minus_1p`, `plus_1y`, etc.)

## 📦 Installation

### From VS Code Marketplace (Recommended)
1. Open VS Code
2. Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "Silverfin: Level-Up"
4. Click **Install** on the extension by AnthonyHooghe
5. Reload VS Code when prompted

**Or install via Command Palette:**
1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type `ext install AnthonyHooghe.silverfin-level-up`
3. Press Enter

### From VSIX File
1. Download the latest `.vsix` file from the [releases](https://github.com/ahooghe/Silverfin---LvlUp/releases)
2. In VS Code, open the Command Palette (`Ctrl+Shift+P`)
3. Run "Extensions: Install from VSIX..."
4. Select the downloaded `.vsix` file

### From Source (Development)
1. Clone the repository:
   ```bash
   git clone https://github.com/ahooghe/Silverfin---LvlUp.git
   ```

2. Navigate to the project directory:
   ```bash
   cd silverfin-level-up
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Compile the extension:
   ```bash
   npm run compile
   ```

5. Open in VS Code and press `F5` to run in Extension Development Host

## 🎯 Usage

### Getting Started
1. **Open any `.liquid` file** - The extension automatically activates
2. **Apply the Silverfin Theme** - The extension sets this as default, or manually select "Silverfin Theme" from the Color Theme picker
3. **Start coding** - Enjoy syntax highlighting, auto-completion, and hover documentation

### Key Features in Action
- **Type `input`** and press Tab to insert an input field snippet
- **Hover over any tag or filter** to see detailed documentation
- **Type `period.accounts.`** to see available properties and methods
- **Use auto-completion** for complex object paths and properties
- **Leverage snippets** for rapid template development

### File Association
The extension automatically associates with `.liquid` files and provides the "Silverfin: Level-Up" language mode.

## 🛠️ Development

### Project Structure
```
├── src/
│   ├── extension.ts          # Main extension logic
│   ├── dictionary.ts         # Hover documentation definitions
│   └── silverfinDbModel.ts   # Database model for auto-completion
├── snippets/                 # Code snippet definitions
├── syntaxes/                 # TextMate grammar
├── themes/                   # Color theme definition
└── language-configuration.json # Language configuration
```

### Building
```bash
npm run compile      # Compile TypeScript
npm run watch        # Watch mode for development
```

## 🤝 Contributing

We welcome contributions! Please feel free to:
- Report bugs or request features via [GitHub Issues](https://github.com/ahooghe/Silverfin---LvlUp/issues)
- Submit pull requests for improvements
- Suggest new snippets or documentation enhancements

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.txt) file for details.

## 🔗 Links

- **VS Code Marketplace**: [Install Silverfin: Level-Up](https://marketplace.visualstudio.com/items?itemName=AnthonyHooghe.silverfin-level-up)
- **Repository**: [GitHub](https://github.com/ahooghe/Silverfin---LvlUp)
- **Issues**: [Bug Reports & Feature Requests](https://github.com/ahooghe/Silverfin---LvlUp/issues)
- **Publisher**: AnthonyHooghe

---

*Enhance your Silverfin template development with intelligent code assistance, comprehensive documentation, and a tailored development environment.*