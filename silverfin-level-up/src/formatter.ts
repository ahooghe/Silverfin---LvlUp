import * as vscode from 'vscode';

// Configurable formatter behavior
interface FormatterConfig {
    logicBlocks: string[];
    logicSubBlocks: string[];
    liquidBlocks: string[];
    singleLineLogicTags: string[];
    htmlSingleTags: string[];
    htmlBlockTags: string[];
    htmlInlineTags: string[];
    markdownFlushTags: string[];
    markdownClosingTags: string[];
    markdownStyleTags: string[];
    padWithTabs: boolean;
    tabSize: number;
    addBlankLineAfterLogicBlock: boolean;
    enforceBlockFormatting: boolean;
    preserveMarkdownTables: boolean;
}

const defaultConfig: FormatterConfig = {
    logicBlocks: ['if', 'for', 'fori', 'ifi', 'unless', 'case', 'stripnewlines'],
    logicSubBlocks: ['else', 'elsif', 'elsifi', 'when'],
    liquidBlocks: ['capture', 'locale', 'linkto', 'radiogroup', 'currencyconfiguration', 'adjustmentbutton', 'ic', 'nic', 'comment'],
    singleLineLogicTags: ['assign', 'input', 'result', 'push', 'pop', 'newpage', 'include', 'changeorientation', 't', 't=', 'unreconciled'],
    htmlSingleTags: ['br', 'hr'],
    htmlBlockTags: ['table', 'thead', 'tbody', 'tr', 'td', 'th', 'p'],
    htmlInlineTags: ['b', 'i', 'em', 'u', 'sub', 'sup', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'],
    markdownFlushTags: ['infotext', 'warningtext'],
    markdownClosingTags: ['infotext', 'warningtext'],
    markdownStyleTags: ['target', 'font', 'indent'],
    padWithTabs: true,
    tabSize: 4,
    addBlankLineAfterLogicBlock: true,
    enforceBlockFormatting: false,
    preserveMarkdownTables: true,
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
    let inMarkdownTable = false;
    let inCapture = false;


    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        let completeTag: string | undefined;
        let cleanedLine: string | undefined;

        if (line.length === 0) {
            output.push('');
            continue;
        }
        else if (line.search(/({%|{{|<)/) === -1) {
            output.push(setIndent(line, indentLevel, config));
            continue;
        }
        else {
            if (line.search(/{%\sic\s%}/) !== -1) {
                completeTag = line;
                while (completeTag?.search(/{%\sendic\s%}/) === -1 && i < rawLines.length - 1) {
                    console.log(`  Continuing ic tag at line ${i}`);
                    i++;
                    const nextLine = rawLines[i].trim();
                    if (nextLine.length === 0) {
                        continue;
                    }
                    completeTag += ' ' + nextLine;
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
            if (cleanedLine.search('<') === 0) {
                let htmlTag = cleanedLine.substring(1, cleanedLine.search('>'));
                if (config.htmlSingleTags.includes(htmlTag)) {
                    output.push(setIndent(cleanedLine.substring(0, cleanedLine.search('>') + 1), indentLevel, config));
                    cleanedLine = cleanedLine.substring(cleanedLine.search('>') + 1).trim();
                } else if (config.htmlInlineTags.includes(htmlTag)) {
                    const closingTagPattern = new RegExp(`</${htmlTag}>`, 'i');
                    const closingTagIndex: number = cleanedLine.search(closingTagPattern);
                    if (closingTagIndex !== -1) {
                        output.push(setIndent(cleanedLine.substring(0, closingTagIndex + `</${htmlTag}>`.length), indentLevel, config));
                        cleanedLine = cleanedLine.substring(closingTagIndex + `</${htmlTag}>`.length).trim();
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
            else if (cleanedLine.indexOf('{% ic') === 0) {
                // If the next tag in the ic tags is a {::warningtext} or {::infotext} tag, we should ensure that this tag is attached to the line right before it, as well as its closing tag {:/warningtext} or {:/infotext}. Apart from this, the rest inside the ic tag should be in line with the code already written.
                output.push(setIndent(cleanedLine, indentLevel, config));
                cleanedLine = '';

            }
            else if (cleanedLine.search(/({%|{{|<)/) === -1) {
                output.push(setIndent(cleanedLine, indentLevel, config));
                cleanedLine = '';
            }
            else if (cleanedLine.search(/({%|{{|<)/) > 0) {
                const contentBeforeTag = cleanedLine.slice(0, cleanedLine.search(/({%|{{|<)/));
                if (contentBeforeTag.trim().length > 0) {
                    output.push(setIndent(contentBeforeTag, indentLevel, config));
                }
                cleanedLine = cleanedLine.slice(cleanedLine.search(/({%|{{|<)/)).trim();
            } else {
                const tag = cleanedLine.slice(0, cleanedLine.search(/(%}|}})/) + 2);
                cleanedLine = cleanedLine.slice(cleanedLine.search(/(%}|}})/) + 2).trim();
                // The tagId is the first word after the opening tag
                const tagId = tag.split(' ')[1] || '';
                if (tag.startsWith('{{') || config.singleLineLogicTags.includes(tagId)) {
                    output.push(setIndent(tag, indentLevel, config));
                } else if (config.logicBlocks.includes(tagId) || config.liquidBlocks.includes(tagId)) {
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
    console.log(`Finished formatting`);
    return output.join('\n');
}

function cleanHtml(line: string): string {
    return line.replace(/^\s*(<.*?>)\s*$/, '$1').replace(/<\s+/g, '<').replace(/\s+>/g, '>').replace(/\s+/g, ' ').replace(/\s*(class|colspan)\s*=\s*/g, ' $1=').replace(/(<\/)\s+/g, '$1');
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


// To do: Implement single line logic for ic and nic tags. If open/close is on the same line, it should be formatted as a single line.
// To do: Implement logic for preserving markdown tables.
// To do: Implement logic for preserving info and warning text tags in markdown.
