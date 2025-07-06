# Silverfin: Level-Up (Beta)

Welcome to **Silverfin: Level-Up**, a Visual Studio Code extension designed to enhance your development experience with Silverfin `.liquid` templates. This extension is currently in **beta**, and we are actively working to improve and expand its functionality. Your feedback is invaluable in shaping the final product!

## Features

### 1. **Syntax Highlighting**
- Comprehensive syntax highlighting for Silverfin `.liquid` templates.
- Supports all Silverfin-specific tags, filters, and constructs, including:
  - `assign`, `capture`, `if`, `elsif`, `else`, `unless`, `for`, `fori`, `case`, `when`, `t`, and more.
  - Filters like `upcase`, `downcase`, `replace`, `remove`, `append`, `prepend`, `date`, `currency`, and many others.
- Differentiated styling for HTML tags, attributes, and embedded Liquid variables.

### 2. **Hover Documentation**
- Hover over any Silverfin tag, filter, or attribute to see detailed documentation.
- Includes descriptions, examples, and attribute details for quick reference.

### 3. **Auto-Closing Tags**
- Automatically closes Silverfin tags like `{% if %}`, `{% for %}`, `{% case %}`, and more.
- Ensures proper nesting and reduces syntax errors.

### 4. **Auto-Padding**
- Automatically adds proper indentation for nested tags and blocks.
- Improves readability and maintains consistent formatting.

### 5. **Snippets**
- Predefined snippets for common Silverfin constructs:
  - `assign`, `input`, `if`, `for`, `fori`, `case`, `capture`, `locale`, and more.
- Quickly insert boilerplate code with placeholders for customization.

### 6. **Semantic Tokens**
- Enhanced semantic highlighting for specific keywords like `assign`, `forloop`, and `filters`.
- Differentiates between types, declarations, and variables for better readability.

### 7. **Customizable Theme**
- Comes with the **Silverfin Theme**, a dark theme tailored for Silverfin development.
- Highlights HTML tags, attributes, and Liquid constructs with distinct colors for improved clarity.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/silverfin-level-up.git
   ```

2. Navigate to the project directory:
   ```bash
   cd silverfin-level-up
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

4. Open the project in Visual Studio Code:
   ```bash
   code .
   ```

5. Press `F5` to run the extension in a new Extension Development Host window.

## Usage

- Open any `.liquid` file to see the syntax highlighting in action.
- Customize the highlighting rules by modifying the `syntaxes/silverfin.tmLanguage.json` file.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.