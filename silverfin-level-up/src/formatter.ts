import * as vscode from 'vscode';

// Configurable formatter behavior
interface FormatterConfig {
    logicBlocks: string[];
    logicSubBlocks: string[];
    liquidBlocks: string[];
    singleLineLogicTags: string[];
    htmlSingleTags: string[];
    htmlInlineTags: string[];
    htmlBlockTags: string[];
    padWithTabs: boolean;
    tabSize: number;
}

const defaultConfig: FormatterConfig = {
    logicBlocks: ['if', 'for', 'fori', 'ifi', 'unless', 'case', 'stripnewlines'],
    logicSubBlocks: ['else', 'elsif', 'elsifi', 'when'],
    liquidBlocks: ['capture', 'locale', 'linkto', 'radiogroup', 'currencyconfiguration', 'adjustmentbutton', 'ic', 'nic', 'comment'],
    singleLineLogicTags: ['assign', 'input', 'result', 'push', 'pop', 'newpage', 'include', 'changeorientation', 't', 't=', 'unreconciled'],
    htmlSingleTags: ['br', 'hr'],
    htmlInlineTags: ['b', 'i', 'em', 'u', 'sub', 'sup', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'],
    htmlBlockTags: ['table', 'thead', 'tbody', 'tr'],
    padWithTabs: true,
    tabSize: 4,
};

export function activateFormatter(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('silverfin-lvlup', {
            provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                const config = { ...defaultConfig };
                const editorConfig = vscode.workspace.getConfiguration('editor', document.uri);
                config.tabSize = editorConfig.get('tabSize') as number;
                config.padWithTabs = !editorConfig.get('insertSpaces') as boolean;

                const formatted = formatSilverfin(document.getText(), config);
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(document.getText().length)
                );
                return [vscode.TextEdit.replace(fullRange, formatted)];
            }
        })
    );
}

function formatSilverfin(text: string, config: FormatterConfig): string {
    const rawLines = text.replace(/\r\n/g, '\n').split('\n');
    const output: string[] = [];
    let indentLevel = 0;
    let captureLevel = 0;

    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        let completeTag: string | undefined;
        let cleanedLine: string | undefined;
        let startsWithPipe = false
        let inMarkdownTable = false;

        if (line.length === 0) {
            output.push('');
            continue;
        }
        else if (line.search(/({%|{{|{:|<)/) === -1) {
            output.push(setIndent(line, indentLevel, config));
            continue;
        }
        else {
            if (line.search(/{%\s*stripnewlines\s*%}/) !== -1) {
                let originalIndex = i;
                let currentLine = rawLines[i];
                let stripnewlinesBlock = '';
                while (currentLine.search(/{%\s*endstripnewlines\s*%}/) === -1 && i < rawLines.length - 1) {
                    if (currentLine.trim().indexOf('|') === 0)
                        startsWithPipe = true;
                    if (startsWithPipe && currentLine.search(/{%\s*newline\s*%}/) !== -1) {
                        inMarkdownTable = true;
                        break;
                    }
                    i++;
                    stripnewlinesBlock += currentLine + '\n';
                    currentLine = rawLines[i];
                }
                if (inMarkdownTable) {
                    stripnewlinesBlock += currentLine;
                    output.push(stripnewlinesBlock);
                    continue;
                } else {
                    i = originalIndex;
                }
            }
            else if (line.search(/{%\s*ic\s*%}/) !== -1) {
                completeTag = line;
                while (completeTag?.search(/{%\s*endic\s*%}/) === -1 && i < rawLines.length - 1) {
                    i++;
                    const nextLine = rawLines[i].trim();
                    if (nextLine.length === 0) {
                        continue;
                    }
                    completeTag += nextLine;
                }
            }
            else if (line.search(/(%}|}}|>)/) === -1) {
                completeTag = line;
                while (completeTag.search(/(%}|}}|>)/) === -1 && i < rawLines.length - 1) {
                    i++;
                    const nextLine = rawLines[i].trim();
                    if (nextLine.length === 0) {
                        continue;
                    }
                    completeTag += ' ' + nextLine;
                }
            }
        }

        if (completeTag !== undefined) {
            cleanedLine = cleanMarkdown(cleanLiquid(cleanHtml(completeTag))).trim();
        } else {
            cleanedLine = cleanMarkdown(cleanLiquid(cleanHtml(line))).trim();
        }

        while (cleanedLine !== '') {
            cleanedLine = cleanedLine.trim();
            if (captureLevel > 0) {
                let matches = cleanedLine.match(/{%\s*capture\s*%}/g);
                let countOpen = matches ? matches.length : 0;

                matches = cleanedLine.match(/{%\s*endcapture\s*%}/g);
                let countClose = matches ? matches.length : 0;
                captureLevel += countOpen - countClose;

                if (captureLevel === 0) {
                    let lastIndex = -1;
                    const regex = /{%\s*endcapture\s*%}/g;
                    let match;
                    while ((match = regex.exec(cleanedLine)) !== null) {
                        lastIndex = match.index;
                    }
                    if (lastIndex === -1 || cleanedLine.substring(0, lastIndex).trim() !== '') {
                        output.push(setIndent(cleanedLine.substring(0, lastIndex), indentLevel, config));
                    }
                    indentLevel--;
                    if (indentLevel < 0) {
                        indentLevel = 0;
                    }
                    output.push(setIndent('{% endcapture %}', indentLevel, config));
                    cleanedLine = cleanedLine.substring(lastIndex + '{% endcapture %}'.length).trim();
                } else {
                    let regexOpeningTags = new RegExp(`({%\\s*(${config.liquidBlocks.join('|')})|{{\\s*(${config.logicBlocks.join('|')})|<\\s*(${config.htmlBlockTags.join('|')}))`, 'g');
                    let regexClosingTags = new RegExp(`({%\\s*end(${config.liquidBlocks.join('|')})|{{\\s*end(${config.logicBlocks.join('|')})|</\\s*(${config.htmlBlockTags.join('|')}))`, 'g');
                    let openingTagMatch = cleanedLine.match(regexOpeningTags);
                    let closingTagMatch = cleanedLine.match(regexClosingTags);
                    let totalMatches = (openingTagMatch ? openingTagMatch.length : 0) - (closingTagMatch ? closingTagMatch.length : 0);

                    if (totalMatches > 0) {
                        output.push(setIndent(cleanedLine, indentLevel, config));
                        indentLevel++;
                    } else if (totalMatches < 0) {
                        indentLevel--;
                        if (indentLevel < 0) {
                            indentLevel = 0;
                        }
                        output.push(setIndent(cleanedLine, indentLevel, config));
                    } else if (cleanedLine.trim() !== '') {
                        output.push(setIndent(cleanedLine, indentLevel, config));
                    }
                    cleanedLine = '';
                }
            } else if (cleanedLine.search('<') === 0) {
                let htmlTag: string = '';
                if (cleanedLine.indexOf('/') !== 1) {
                    htmlTag = cleanedLine.substring(1, cleanedLine.search('>'));
                } else {
                    htmlTag = cleanedLine.substring(2, cleanedLine.search('>'));
                }
                if (config.htmlSingleTags.includes(htmlTag)) {
                    let fullHTMLTag = cleanedLine.substring(0, cleanedLine.search('>') + 1);
                    cleanedLine = cleanedLine.substring(cleanedLine.search('>') + 1).trim();
                    output.push(setIndent(fullHTMLTag, indentLevel, config));
                } else if (config.htmlInlineTags.includes(htmlTag)) {
                    const closingTagPattern = new RegExp(`</${htmlTag}>`, 'i');
                    const closingTagIndex: number = cleanedLine.search(closingTagPattern);
                    if (closingTagIndex !== -1) {
                        let closingTag = cleanedLine.substring(0, closingTagIndex + `</${htmlTag}>`.length)
                        cleanedLine = cleanedLine.substring(closingTagIndex + `</${htmlTag}>`.length).trim();
                        output.push(setIndent(closingTag, indentLevel, config));
                    } else {
                        output.push(setIndent(cleanedLine, indentLevel, config));
                        cleanedLine = '';
                    }
                } else {
                    let fullHTMLTag = cleanedLine.substring(0, cleanedLine.search('>') + 1);
                    cleanedLine = cleanedLine.substring(cleanedLine.search('>') + 1).trim();
                    if (fullHTMLTag.indexOf('</') !== -1) {
                        indentLevel--;
                        if (indentLevel < 0) {
                            indentLevel = 0;
                        }
                        output.push(setIndent(fullHTMLTag, indentLevel, config));
                    } else {
                        output.push(setIndent(fullHTMLTag, indentLevel, config));
                        indentLevel++;
                    }
                }

            }
            else if (cleanedLine.search('{:') === 0 && cleanedLine.search('}') !== -1) {
                let markdownTag = cleanedLine.substring(0, cleanedLine.search('}') + 1);
                output.push(markdownTag.trim());
                cleanedLine = cleanedLine.substring(cleanedLine.search('}') + 1).trim();
            }
            else if (cleanedLine.search(/({%|{{|<)/) === -1) {
                output.push(setIndent(cleanedLine, indentLevel, config));
                cleanedLine = '';
            }
            else if (cleanedLine.search(/({%|{{|<)/) > 0) {
                let contentBeforeTag = cleanedLine.slice(0, cleanedLine.search(/({%|{{|<)/));
                if (contentBeforeTag.trim().length > 0) {
                    output.push(setIndent(contentBeforeTag, indentLevel, config));
                }
                cleanedLine = cleanedLine.slice(cleanedLine.search(/({%|{{|<)/)).trim();
            } else {
                // The opening symbol should match the closing one ({% with %}, {{ with }})
                let tag = '';
                switch (cleanedLine.substring(0, 2)) {
                    case '{{':
                        tag = cleanedLine.substring(0, cleanedLine.search('}}') + 2);
                        cleanedLine = cleanedLine.substring(cleanedLine.search('}}') + 2).trim();
                        break;
                    case '{%':
                        tag = cleanedLine.substring(0, cleanedLine.search('%}') + 2);
                        cleanedLine = cleanedLine.substring(cleanedLine.search('%}') + 2).trim();
                        break;
                    default:
                        tag = '';
                        break;
                }
                const tagId = tag.split(' ')[1] || '';
                if (tag.startsWith('{{') || config.singleLineLogicTags.includes(tagId)) {
                    output.push(setIndent(tag, indentLevel, config));
                } else if (tagId === 'capture') {
                    captureLevel++;
                    output.push(setIndent(tag, indentLevel, config));
                    indentLevel++;

                    let openMatches = cleanedLine.match(/{%\s*capture\s*%}/g);
                    let countOpen = openMatches ? openMatches.length : 0;
                    let closeMatches = cleanedLine.match(/{%\s*endcapture\s*%}/g);
                    let countClose = closeMatches ? closeMatches.length : 0;
                    captureLevel += countOpen - countClose;

                    if (captureLevel === 0) {
                        let lastIndex = -1;
                        const regex = /{%\s*endcapture\s*%}/g;
                        let match;
                        while ((match = regex.exec(cleanedLine)) !== null) {
                            lastIndex = match.index;
                        }
                        output.push(setIndent(cleanedLine.substring(0, lastIndex), indentLevel, config));
                        indentLevel--;
                        if (indentLevel < 0) {
                            indentLevel = 0;
                        }
                        output.push(setIndent('{% endcapture %}', indentLevel, config));
                        cleanedLine = cleanedLine.substring(lastIndex + '{% endcapture %}'.length).trim();
                    }
                } else if (config.logicBlocks.includes(tagId) || config.liquidBlocks.includes(tagId)) {
                    output.push(setIndent(tag, indentLevel, config));
                    indentLevel++;
                } else if (config.logicSubBlocks.includes(tagId)) {
                    indentLevel--;
                    if (indentLevel < 0) {
                        indentLevel = 0;
                    }
                    output.push(setIndent(tag, indentLevel, config));
                    indentLevel++;
                } else {
                    indentLevel--;
                    if (indentLevel < 0) {
                        indentLevel = 0;
                    }
                    output.push(setIndent(tag, indentLevel, config));
                    if (rawLines[i + 1] && rawLines[i + 1].trim().length !== 0 &&
                        !(cleanedLine.substring(0, 6) === '{% end' ||
                            (cleanedLine === '' && rawLines[i + 1] && rawLines[i + 1].trim().substring(0, 6) === '{% end') ||
                            cleanedLine.substring(0, 2) === '</' ||
                            (cleanedLine === '' && rawLines[i + 1] && rawLines[i + 1].trim().substring(0, 2) === '</'))) {
                        output.push('');
                    }

                }
            }
        }
    }
    return output.join('\n');
}

function cleanHtml(line: string): string {
    return line.replace(/<[^>]*>/g, tag =>
        tag.replace(/<\s+/g, '<').replace(/\s+>/g, '>').replace(/\s*(class|colspan)\s*=\s*/g, ' $1=')
    );
}

function cleanLiquid(line: string): string {
    // Remove leading and trailing whitespace from Liquid tags
    return line.replace(/^\s*({{.*?}}|{%-.*?-%})\s*$/, '$1');
}

function cleanMarkdown(line: string): string {
    // Remove leading and trailing whitespace from Markdown tags
    return line.replace(/^\s*(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_)\s*$/, '$1');
}

function setIndent(line: string, level: number, config: FormatterConfig): string {
    const indent = config.padWithTabs ? '\t'.repeat(level) : ' '.repeat(config.tabSize * level);
    return indent + line;
}

// To do: Implement logic for preserving markdown tables.