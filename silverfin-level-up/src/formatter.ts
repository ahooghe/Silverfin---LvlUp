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
            const stripnewlinesResult = handleStripnewlines(rawLines, i);
            if (stripnewlinesResult.handled) {
                if (stripnewlinesResult.isMarkdownTable) {
                    output.push(stripnewlinesResult.content);
                    i = stripnewlinesResult.nextIndex;
                    continue;
                } else {
                    i = stripnewlinesResult.nextIndex;
                }
            } else {
                const icResult = handleIcBlock(rawLines, i);
                if (icResult.handled) {
                    completeTag = icResult.content;
                    i = icResult.nextIndex;
                } else {
                    const incompleteResult = handleIncompleteTag(rawLines, i);
                    if (incompleteResult.handled) {
                        completeTag = incompleteResult.content;
                        i = incompleteResult.nextIndex;
                    }
                }
            }
        }

        if (completeTag !== undefined) {
            cleanedLine = cleanMarkdown(cleanLiquid(cleanHtml(completeTag))).trim();
        } else {
            cleanedLine = cleanMarkdown(cleanLiquid(cleanHtml(line))).trim();
        }

        const processResult = processCleanedLine(cleanedLine, captureLevel, indentLevel, config, output, rawLines, i);
        indentLevel = processResult.indentLevel;
        captureLevel = processResult.captureLevel;
    }
    return output.join('\n');
}

function handleStripnewlines(rawLines: string[], currentIndex: number): { handled: boolean; isMarkdownTable: boolean; content: string; nextIndex: number } {
    const line = rawLines[currentIndex];
    if (line.search(/{%\s*stripnewlines\s*%}/) === -1) {
        return { handled: false, isMarkdownTable: false, content: '', nextIndex: currentIndex };
    }

    let i = currentIndex;
    let originalIndex = i;
    let currentLine = rawLines[i];
    let stripnewlinesBlock = '';
    let startsWithPipe = false;
    let inMarkdownTable = false;

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
        return { handled: true, isMarkdownTable: true, content: stripnewlinesBlock, nextIndex: i };
    } else {
        return { handled: true, isMarkdownTable: false, content: '', nextIndex: originalIndex };
    }
}

function handleIcBlock(rawLines: string[], currentIndex: number): { handled: boolean; content: string; nextIndex: number } {
    const line = rawLines[currentIndex];
    if (line.search(/{%\s*ic\s*%}/) === -1) {
        return { handled: false, content: '', nextIndex: currentIndex };
    }

    let i = currentIndex;
    let completeTag = line;
    while (completeTag?.search(/{%\s*endic\s*%}/) === -1 && i < rawLines.length - 1) {
        i++;
        const nextLine = rawLines[i].trim();
        if (nextLine.length === 0) {
            continue;
        }
        completeTag += nextLine;
    }

    return { handled: true, content: completeTag, nextIndex: i };
}

function handleIncompleteTag(rawLines: string[], currentIndex: number): { handled: boolean; content: string; nextIndex: number } {
    const line = rawLines[currentIndex];
    if (line.search(/(%}|}}|>)/) !== -1) {
        return { handled: false, content: '', nextIndex: currentIndex };
    }

    let i = currentIndex;
    let completeTag = line;
    while (completeTag.search(/(%}|}}|>)/) === -1 && i < rawLines.length - 1) {
        i++;
        const nextLine = rawLines[i].trim();
        if (nextLine.length === 0) {
            continue;
        }
        completeTag += ' ' + nextLine;
    }

    return { handled: true, content: completeTag, nextIndex: i };
}

function processCleanedLine(cleanedLine: string, captureLevel: number, indentLevel: number, config: FormatterConfig, output: string[], rawLines: string[], currentIndex: number): { indentLevel: number; captureLevel: number } {
    let currentIndentLevel = indentLevel;
    let currentCaptureLevel = captureLevel;
    let remainingLine = cleanedLine;

    while (remainingLine !== '') {
        remainingLine = remainingLine.trim();
        
        if (currentCaptureLevel > 0) {
            const captureResult = processCaptureMode(remainingLine, currentCaptureLevel, currentIndentLevel, config, output);
            currentCaptureLevel = captureResult.captureLevel;
            currentIndentLevel = captureResult.indentLevel;
            remainingLine = captureResult.remainingLine;
        } else {
            const normalResult = processNormalMode(remainingLine, currentIndentLevel, currentCaptureLevel, config, output, rawLines, currentIndex);
            currentIndentLevel = normalResult.indentLevel;
            currentCaptureLevel = normalResult.captureLevel;
            remainingLine = normalResult.remainingLine;
        }
    }

    return { indentLevel: currentIndentLevel, captureLevel: currentCaptureLevel };
}

function processCaptureMode(cleanedLine: string, captureLevel: number, indentLevel: number, config: FormatterConfig, output: string[]): { captureLevel: number; indentLevel: number; remainingLine: string } {
    let currentCaptureLevel = captureLevel;
    let currentIndentLevel = indentLevel;

    let matches = cleanedLine.match(/{%\s*capture\s*%}/g);
    let countOpen = matches ? matches.length : 0;

    matches = cleanedLine.match(/{%\s*endcapture\s*%}/g);
    let countClose = matches ? matches.length : 0;
    currentCaptureLevel += countOpen - countClose;

    if (currentCaptureLevel === 0) {
        let lastIndex = -1;
        const regex = /{%\s*endcapture\s*%}/g;
        let match;
        while ((match = regex.exec(cleanedLine)) !== null) {
            lastIndex = match.index;
        }
        if (lastIndex === -1 || cleanedLine.substring(0, lastIndex).trim() !== '') {
            output.push(setIndent(cleanedLine.substring(0, lastIndex), currentIndentLevel, config));
        }
        currentIndentLevel--;
        if (currentIndentLevel < 0) {
            currentIndentLevel = 0;
        }
        output.push(setIndent('{% endcapture %}', currentIndentLevel, config));
        return { captureLevel: currentCaptureLevel, indentLevel: currentIndentLevel, remainingLine: cleanedLine.substring(lastIndex + '{% endcapture %}'.length).trim() };
    } else {
        let regexOpeningTags = new RegExp(`({%\\s*(${config.liquidBlocks.join('|')})|{{\\s*(${config.logicBlocks.join('|')})|<\\s*(${config.htmlBlockTags.join('|')}))`, 'g');
        let regexClosingTags = new RegExp(`({%\\s*end(${config.liquidBlocks.join('|')})|{{\\s*end(${config.logicBlocks.join('|')})|</\\s*(${config.htmlBlockTags.join('|')}))`, 'g');
        let openingTagMatch = cleanedLine.match(regexOpeningTags);
        let closingTagMatch = cleanedLine.match(regexClosingTags);
        let totalMatches = (openingTagMatch ? openingTagMatch.length : 0) - (closingTagMatch ? closingTagMatch.length : 0);

        if (totalMatches > 0) {
            output.push(setIndent(cleanedLine, currentIndentLevel, config));
            currentIndentLevel++;
        } else if (totalMatches < 0) {
            currentIndentLevel--;
            if (currentIndentLevel < 0) {
                currentIndentLevel = 0;
            }
            output.push(setIndent(cleanedLine, currentIndentLevel, config));
        } else if (cleanedLine.trim() !== '') {
            output.push(setIndent(cleanedLine, currentIndentLevel, config));
        }
        return { captureLevel: currentCaptureLevel, indentLevel: currentIndentLevel, remainingLine: '' };
    }
}

function processNormalMode(cleanedLine: string, indentLevel: number, captureLevel: number, config: FormatterConfig, output: string[], rawLines: string[], currentIndex: number): { indentLevel: number; captureLevel: number; remainingLine: string } {
    let currentIndentLevel = indentLevel;
    let currentCaptureLevel = captureLevel;

    if (cleanedLine.search('<') === 0) {
        return processHtmlTag(cleanedLine, currentIndentLevel, config, output);
    }
    else if (cleanedLine.search('{:') === 0 && cleanedLine.search('}') !== -1) {
        const markdownResult = processMarkdownTag(cleanedLine, output);
        return { indentLevel: currentIndentLevel, captureLevel: markdownResult.captureLevel, remainingLine: markdownResult.remainingLine };
    }
    else if (cleanedLine.search(/({%|{{|<)/) === -1) {
        output.push(setIndent(cleanedLine, currentIndentLevel, config));
        return { indentLevel: currentIndentLevel, captureLevel: currentCaptureLevel, remainingLine: '' };
    }
    else if (cleanedLine.search(/({%|{{|<)/) > 0) {
        return processContentBeforeTag(cleanedLine, currentIndentLevel, config, output);
    } else {
        return processLiquidTag(cleanedLine, currentIndentLevel, currentCaptureLevel, config, output, rawLines, currentIndex);
    }
}

function processHtmlTag(cleanedLine: string, indentLevel: number, config: FormatterConfig, output: string[]): { indentLevel: number; captureLevel: number; remainingLine: string } {
    let currentIndentLevel = indentLevel;
    let htmlTag: string = '';
    if (cleanedLine.indexOf('/') !== 1) {
        htmlTag = cleanedLine.substring(1, cleanedLine.search('>'));
    } else {
        htmlTag = cleanedLine.substring(2, cleanedLine.search('>'));
    }

    if (config.htmlSingleTags.includes(htmlTag)) {
        let fullHTMLTag = cleanedLine.substring(0, cleanedLine.search('>') + 1);
        let remainingLine = cleanedLine.substring(cleanedLine.search('>') + 1).trim();
        output.push(setIndent(fullHTMLTag, currentIndentLevel, config));
        return { indentLevel: currentIndentLevel, captureLevel: 0, remainingLine };
    } else if (config.htmlInlineTags.includes(htmlTag)) {
        const closingTagPattern = new RegExp(`</${htmlTag}>`, 'i');
        const closingTagIndex: number = cleanedLine.search(closingTagPattern);
        if (closingTagIndex !== -1) {
            let closingTag = cleanedLine.substring(0, closingTagIndex + `</${htmlTag}>`.length)
            let remainingLine = cleanedLine.substring(closingTagIndex + `</${htmlTag}>`.length).trim();
            output.push(setIndent(closingTag, currentIndentLevel, config));
            return { indentLevel: currentIndentLevel, captureLevel: 0, remainingLine };
        } else {
            output.push(setIndent(cleanedLine, currentIndentLevel, config));
            return { indentLevel: currentIndentLevel, captureLevel: 0, remainingLine: '' };
        }
    } else {
        let fullHTMLTag = cleanedLine.substring(0, cleanedLine.search('>') + 1);
        let remainingLine = cleanedLine.substring(cleanedLine.search('>') + 1).trim();
        if (fullHTMLTag.indexOf('</') !== -1) {
            currentIndentLevel--;
            if (currentIndentLevel < 0) {
                currentIndentLevel = 0;
            }
            output.push(setIndent(fullHTMLTag, currentIndentLevel, config));
        } else {
            output.push(setIndent(fullHTMLTag, currentIndentLevel, config));
            currentIndentLevel++;
        }
        return { indentLevel: currentIndentLevel, captureLevel: 0, remainingLine };
    }
}

function processMarkdownTag(cleanedLine: string, output: string[]): { captureLevel: number; remainingLine: string } {
    let markdownTag = cleanedLine.substring(0, cleanedLine.search('}') + 1);
    output.push(markdownTag.trim());
    let remainingLine = cleanedLine.substring(cleanedLine.search('}') + 1).trim();
    return { captureLevel: 0, remainingLine };
}

function processContentBeforeTag(cleanedLine: string, indentLevel: number, config: FormatterConfig, output: string[]): { indentLevel: number; captureLevel: number; remainingLine: string } {
    let contentBeforeTag = cleanedLine.slice(0, cleanedLine.search(/({%|{{|<)/));
    if (contentBeforeTag.trim().length > 0) {
        output.push(setIndent(contentBeforeTag, indentLevel, config));
    }
    let remainingLine = cleanedLine.slice(cleanedLine.search(/({%|{{|<)/)).trim();
    return { indentLevel, captureLevel: 0, remainingLine };
}

function processLiquidTag(cleanedLine: string, indentLevel: number, captureLevel: number, config: FormatterConfig, output: string[], rawLines: string[], currentIndex: number): { indentLevel: number; captureLevel: number; remainingLine: string } {
    let currentIndentLevel = indentLevel;
    let currentCaptureLevel = captureLevel;

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
        output.push(setIndent(tag, currentIndentLevel, config));
    } else if (tagId === 'capture') {
        currentCaptureLevel++;
        output.push(setIndent(tag, currentIndentLevel, config));
        currentIndentLevel++;

        let openMatches = cleanedLine.match(/{%\s*capture\s*%}/g);
        let countOpen = openMatches ? openMatches.length : 0;
        let closeMatches = cleanedLine.match(/{%\s*endcapture\s*%}/g);
        let countClose = closeMatches ? closeMatches.length : 0;
        currentCaptureLevel += countOpen - countClose;

        if (currentCaptureLevel === 0) {
            let lastIndex = -1;
            const regex = /{%\s*endcapture\s*%}/g;
            let match;
            while ((match = regex.exec(cleanedLine)) !== null) {
                lastIndex = match.index;
            }
            output.push(setIndent(cleanedLine.substring(0, lastIndex), currentIndentLevel, config));
            currentIndentLevel--;
            if (currentIndentLevel < 0) {
                currentIndentLevel = 0;
            }
            output.push(setIndent('{% endcapture %}', currentIndentLevel, config));
            cleanedLine = cleanedLine.substring(lastIndex + '{% endcapture %}'.length).trim();
        }
    } else if (config.logicBlocks.includes(tagId) || config.liquidBlocks.includes(tagId)) {
        output.push(setIndent(tag, currentIndentLevel, config));
        currentIndentLevel++;
    } else if (config.logicSubBlocks.includes(tagId)) {
        currentIndentLevel--;
        if (currentIndentLevel < 0) {
            currentIndentLevel = 0;
        }
        output.push(setIndent(tag, currentIndentLevel, config));
        currentIndentLevel++;
    } else {
        currentIndentLevel--;
        if (currentIndentLevel < 0) {
            currentIndentLevel = 0;
        }
        output.push(setIndent(tag, currentIndentLevel, config));
        if (rawLines[currentIndex + 1] && rawLines[currentIndex + 1].trim().length !== 0 &&
            !(cleanedLine.substring(0, 6) === '{% end' ||
                (cleanedLine === '' && rawLines[currentIndex + 1] && rawLines[currentIndex + 1].trim().substring(0, 6) === '{% end') ||
                cleanedLine.substring(0, 2) === '</' ||
                (cleanedLine === '' && rawLines[currentIndex + 1] && rawLines[currentIndex + 1].trim().substring(0, 2) === '</'))) {
            output.push('');
        }
    }

    return { indentLevel: currentIndentLevel, captureLevel: currentCaptureLevel, remainingLine: cleanedLine };
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