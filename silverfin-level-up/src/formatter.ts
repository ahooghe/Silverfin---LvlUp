import * as vscode from 'vscode';

// Configuration interface for formatter behavior
interface FormatterConfig {
    singleLineNonBlockTags: boolean;
    autoFormatOnSave: boolean;
    autoCloseTags: boolean;
}

const defaultConfig: FormatterConfig = {
    singleLineNonBlockTags: true,
    autoFormatOnSave: false,
    autoCloseTags: false,
};

// Main activation function for the formatter extension
export function activateFormatter(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('silverfin-lvlup', {
            provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                const config = { ...defaultConfig };
                const formatted = formatLiquid(document.getText(), config);
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(document.getText().length)
                );
                return [vscode.TextEdit.replace(fullRange, formatted)];
            }
        })
    );
}

// Helper to trim extra spaces in Liquid tags, except inside quotes
function trimLiquidTagSpaces(tag: string): string {
    // Only process {% ... %} or {{ ... }}
    const tagMatch = tag.match(/^({[{%])([\s\S]*?)([%}]})$/);
    if (!tagMatch) return tag;

    let [, open, inner, close] = tagMatch;

    // Remove leading/trailing spaces in the inner part (but keep spaces inside quotes)
    let result = '';
    let inQuotes = false;
    let quoteChar = '';
    let prevChar = '';
    let buffer = '';

    // Collapse spaces outside quotes
    for (let i = 0; i < inner.length; i++) {
        const char = inner[i];

        if ((char === '"' || char === "'") && prevChar !== '\\') {
            if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar) {
                inQuotes = false;
                quoteChar = '';
            }
        }

        if (!inQuotes && /\s/.test(char)) {
            if (buffer === '') buffer = ' ';
        } else {
            if (buffer) {
                result += buffer;
                buffer = '';
            }
            result += char;
        }
        prevChar = char;
    }
    if (buffer) result += buffer;

    // Ensure pipes outside quotes are surrounded by single spaces
    let final = '';
    inQuotes = false;
    quoteChar = '';
    for (let i = 0; i < result.length; i++) {
        const char = result[i];

        if ((char === '"' || char === "'") && result[i - 1] !== '\\') {
            if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar) {
                inQuotes = false;
                quoteChar = '';
            }
        }

        if (!inQuotes && char === '|') {
            // Remove spaces before
            while (final.length && final[final.length - 1] === ' ') {
                final = final.slice(0, -1);
            }
            final += ' | ';
            // Skip any spaces after the pipe
            let j = i + 1;
            while (j < result.length && result[j] === ' ') j++;
            i = j - 1;
        } else {
            final += char;
        }
    }

    // Trim leading/trailing spaces, then enforce exactly one space at start/end
    final = final.trim();

    // Add exactly one space after open and before close
    return `${open} ${final} ${close}`;
}

// Split lines that contain multiple block tags (e.g., {:/infotext}{% endic %}) into separate lines
function splitMultiBlockTags(line: string): string[] {
    // Add a newline before every {%, {{, {:
    return line
        .replace(/(\}{1,})(?=({[%{]))/g, '$1\n')
        .replace(/(\}{1,})(?=({:))/g, '$1\n')
        .split('\n')
        .filter(l => l.trim().length > 0);
}

// Core formatting logic for Liquid templates
function formatLiquid(text: string, config: FormatterConfig): string {
    // Instead of splitting just by \n, preprocess each line for multi-block tags
    let rawLines = text.replace(/\r\n/g, '\n').split('\n');
    let lines: string[] = [];
    for (const rawLine of rawLines) {
        lines.push(...splitMultiBlockTags(rawLine));
    }
    let output: string[] = [];
    let indentLevel = 0;

    // Define HTML tags that should be treated as block elements
    const htmlTags = [
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'ul', 'ol', 'li', 'div', 'p',
        'section', 'article', 'header', 'footer', 'main', 'nav', 'aside'
    ];
    const htmlOpen = `<\\s*(${htmlTags.join('|')})\\b[^>]*?>`;
    const htmlClose = `<\\/\\s*(${htmlTags.join('|')})\\s*>`;

    // Regular expressions for detecting block-level Liquid tags and HTML elements
    const blockStart = new RegExp(
        `{%\\s*(if|ifi|for|case|unless|capture|comment|tablerow|raw|customblock|fori|stripnewlines|locale|addnewinputs|currencyconfiguration|linkto|ic|nic|radiogroup|adjustmentbutton)\\b|${htmlOpen}`,
        'i'
    );
    const blockEnd = new RegExp(
        `{%\\s*end(if|ifi|for|case|unless|capture|comment|tablerow|raw|customblock|fori|stripnewlines|locale|addnewinputs|currencyconfiguration|linkto|ic|nic|radiogroup|adjustmentbutton)\\s*%}|${htmlClose}`,
        'i'
    );

    // Helper functions for analyzing line content
    function isBlockStart(line: string) {
        if (new RegExp(htmlOpen, 'i').test(line)) {
            if (/\/>$/.test(line) || isHtmlSingleLine(line)) return false;
        }
        return blockStart.test(line);
    }

    function isBlockEnd(line: string) {
        return blockEnd.test(line);
    }

    function isNonBlockTag(line: string) {
        return (
            (/{%.*%}/.test(line) && !isBlockStart(line) && !isBlockEnd(line)) ||
            /{{.*}}/.test(line)
        );
    }

    function stripTrailingSpaces(s: string) {
        return s.replace(/[ \t]+$/gm, '');
    }

    function isSingleLineBlock(line: string) {
        return isBlockStart(line) && isBlockEnd(line);
    }

    function isHtmlSingleLine(line: string) {
        return /^<[^>]+>.*<\/[^>]+>$/.test(line.trim());
    }

    // Main formatting loop - process each line and apply indentation
    for (let i = 0; i < lines.length; i++) {
        let line = stripTrailingSpaces(lines[i]);

        // Markdown lines: no indentation for lines starting with | or {:
        if (/^\s*(\||\{:+)/.test(line)) {
            output.push(line.replace(/^\s+/, ''));
            continue;
        }

        // Handle single-line blocks (opening and closing on same line)
        if (isSingleLineBlock(line) || isHtmlSingleLine(line)) {
            if (/{[{%].*[%}]}/.test(line)) {
                line = line.replace(/({[{%][\s\S]*?[%}]})/g, m => trimLiquidTagSpaces(m));
            }
            output.push('\t'.repeat(indentLevel) + line.trim());
            continue;
        }

        // Handle block closing tags - decrease indent first, then add line
        if (isBlockEnd(line)) {
            // Always trim tag spaces and remove all padding
            line = line.trim();
            if (/^({[{%][\s\S]*?[%}]})$/.test(line)) {
                // If the line is just a tag (possibly with padding), trim the tag
                line = trimLiquidTagSpaces(line);
            } else if (/{[{%].*[%}]}/.test(line)) {
                // If the line contains tags, trim all tags in the line
                line = line.replace(/({[{%][\s\S]*?[%}]})/g, m => trimLiquidTagSpaces(m));
            }
            indentLevel = Math.max(0, indentLevel - 1);
            output.push('\t'.repeat(indentLevel) + line);
            continue;
        }

        // Handle block opening tags - add line first, then increase indent
        if (isBlockStart(line)) {
            if (/{[{%].*[%}]}/.test(line)) {
                line = line.replace(/({[{%][\s\S]*?[%}]})/g, m => trimLiquidTagSpaces(m));
            }
            output.push('\t'.repeat(indentLevel) + line.trim());
            indentLevel++;
            continue;
        }

        // Handle non-block Liquid tags (variables, filters, etc.)
        if (isNonBlockTag(line)) {
            if (config.singleLineNonBlockTags) {
                const tags = line.match(/{%.*?%}|{{.*?}}/g);
                if (tags) {
                    tags.forEach(tag => {
                        tag = trimLiquidTagSpaces(tag);
                        output.push('\t'.repeat(indentLevel) + tag.trim());
                    });
                } else {
                    line = line.replace(/({[{%][\s\S]*?[%}]})/g, m => trimLiquidTagSpaces(m));
                    output.push('\t'.repeat(indentLevel) + line.trim());
                }
            } else {
                line = line.replace(/({[{%][\s\S]*?[%}]})/g, m => trimLiquidTagSpaces(m));
                output.push('\t'.repeat(indentLevel) + line.trim());
            }
            continue;
        }

        // Handle regular content lines
        output.push('\t'.repeat(indentLevel) + line.replace(/^\s+/, ''));
    }

    return output.join('\n');
}