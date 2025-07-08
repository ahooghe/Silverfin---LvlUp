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

// Core formatting logic for Liquid templates
function formatLiquid(text: string, config: FormatterConfig): string {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
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
        `{%\\s*(if|for|case|unless|capture|comment|tablerow|raw|customblock|fori|stripnewlines|locale|addnewinputs|currencyconfiguration|linkto|ic|nic|radiogroup)\\b|${htmlOpen}`,
        'i'
    );
    const blockEnd = new RegExp(
        `{%\\s*end(if|for|case|unless|capture|comment|tablerow|raw|customblock|fori|stripnewlines|locale|addnewinputs|currencyconfiguration|linkto|ic|nic|radiogroup)\\s*%}|${htmlClose}`,
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

        // Handle single-line blocks (opening and closing on same line)
        if (isSingleLineBlock(line) || isHtmlSingleLine(line)) {
            output.push('\t'.repeat(indentLevel) + line.trim());
            continue;
        }

        // Handle block closing tags - decrease indent first, then add line
        if (isBlockEnd(line)) {
            indentLevel = Math.max(0, indentLevel - 1);
            output.push('\t'.repeat(indentLevel) + line.trim());
            continue;
        }

        // Handle block opening tags - add line first, then increase indent
        if (isBlockStart(line)) {
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
                        output.push('\t'.repeat(indentLevel) + tag.trim());
                    });
                } else {
                    output.push('\t'.repeat(indentLevel) + line.trim());
                }
            } else {
                output.push('\t'.repeat(indentLevel) + line.trim());
            }
            continue;
        }

        // Handle regular content lines
        output.push('\t'.repeat(indentLevel) + line.replace(/^\s+/, ''));
    }

    return output.join('\n');
}