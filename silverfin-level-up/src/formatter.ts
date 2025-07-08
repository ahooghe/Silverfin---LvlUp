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

function formatLiquid(text: string, config: FormatterConfig): string {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    let output: string[] = [];
    let indentLevel = 0;

    const htmlTags = [
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'ul', 'ol', 'li', 'div', 'p',
        'section', 'article', 'header', 'footer', 'main', 'nav', 'aside'
    ];
    const htmlOpen = `<\\s*(${htmlTags.join('|')})\\b[^>]*?>`;
    const htmlClose = `<\\/\\s*(${htmlTags.join('|')})\\s*>`;

    const blockStart = new RegExp(
        `{%\\s*(if|for|case|unless|capture|comment|tablerow|raw|customblock|fori|stripnewlines|locale|addnewinputs|currencyconfiguration|linkto|ic|nic|radiogroup)\\b|${htmlOpen}`,
        'i'
    );
    const blockEnd = new RegExp(
        `{%\\s*end(if|for|case|unless|capture|comment|tablerow|raw|customblock|fori|stripnewlines|locale|addnewinputs|currencyconfiguration|linkto|ic|nic|radiogroup)\\s*%}|${htmlClose}`,
        'i'
    );

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

    for (let i = 0; i < lines.length; i++) {
        let line = stripTrailingSpaces(lines[i]);

        if (isSingleLineBlock(line) || isHtmlSingleLine(line)) {
            output.push('\t'.repeat(indentLevel) + line.trim());
            continue;
        }

        if (isBlockEnd(line)) {
            indentLevel = Math.max(0, indentLevel - 1);
            output.push('\t'.repeat(indentLevel) + line.trim());
            continue;
        }

        if (isBlockStart(line)) {
            output.push('\t'.repeat(indentLevel) + line.trim());
            indentLevel++;
            continue;
        }

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

        output.push('\t'.repeat(indentLevel) + line);
    }

    return output.join('\n');
}