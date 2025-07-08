import * as vscode from 'vscode';

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

export function activateFormatter(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('silverfin-lvlup', {
            provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                const config = { ...defaultConfig }; // In future, load from settings
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

function formatLiquid(text: string, config: FormatterConfig): string {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    let output: string[] = [];
    let indentLevel = 0;
    let blockStack: string[] = [];

    const blockStart = /{%\s*(if|for|case|unless|capture|comment|tablerow|raw|customblock|fori)\b/;
    const blockEnd = /{%\s*end(if|for|case|unless|capture|comment|tablerow|raw|customblock|fori)\s*%}/;

    function isBlockStart(line: string) {
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
        // Both block start and block end on the same line
        return isBlockStart(line) && isBlockEnd(line);
    }

    for (let i = 0; i < lines.length; i++) {
        let line = stripTrailingSpaces(lines[i]);

        // Handle single-line block: do not indent inner content, treat as flat
        if (isSingleLineBlock(line)) {
            output.push('\t'.repeat(indentLevel) + line.trim());
            continue;
        }

        // Handle block start
        if (isBlockStart(line)) {
            output.push('\t'.repeat(indentLevel) + line.trim());
            blockStack.push(line.match(blockStart)![1]);
            indentLevel++;
            continue;
        }

        // Handle block end
        if (isBlockEnd(line)) {
            indentLevel = Math.max(0, indentLevel - 1);
            output.push('\t'.repeat(indentLevel) + line.trim());
            blockStack.pop();
            continue;
        }

        // Handle non-block tags
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

        // Handle HTML tags (basic)
        if (/^\s*<[^>]+>/.test(line)) {
            output.push('\t'.repeat(indentLevel) + line.trim());
            continue;
        }

        // Plain text
        output.push('\t'.repeat(indentLevel) + line);
    }

    return output.join('\n');
}