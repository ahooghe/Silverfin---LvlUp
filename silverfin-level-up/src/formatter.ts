import * as vscode from 'vscode';

/**
 * Configuration interface for the Silverfin formatter
 * Defines which tags require indentation and formatting rules
 */
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

/**
 * Default configuration for the Silverfin formatter
 * Defines the standard tags and formatting rules for Silverfin templates
 */
const defaultConfig: FormatterConfig = {
    logicBlocks: ['if', 'for', 'fori', 'ifi', 'unless', 'case', 'stripnewlines'],
    logicSubBlocks: ['else', 'elsif', 'elsifi', 'when'],
    liquidBlocks: ['capture', 'locale', 'linkto', 'radiogroup', 'currencyconfiguration', 'adjustmentbutton', 'ic', 'nic', 'comment', 'addnewinputs'],
    singleLineLogicTags: ['assign', 'input', 'result', 'push', 'pop', 'newpage', 'include', 'changeorientation', 't', 't=', 'unreconciled', 'newline', 'linkto', 'signmarker', 'rollforward', 'adjustmenttransaction', 'radioinput', 'input_validation'],
    htmlSingleTags: ['br', 'hr'],
    htmlInlineTags: ['b', 'i', 'em', 'u', 'sub', 'sup', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'],
    htmlBlockTags: ['table', 'thead', 'tbody', 'tr'],
    padWithTabs: true,
    tabSize: 4,
};

/**
 * Activates the Silverfin document formatter
 * Registers the formatter with VS Code for 'silverfin-lvlup' language
 */
export function activateFormatter(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('silverfin-lvlup', {
            provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                // Merge default config with editor preferences
                const config = { ...defaultConfig };
                const editorConfig = vscode.workspace.getConfiguration('editor', document.uri);
                config.tabSize = editorConfig.get('tabSize') as number;
                config.padWithTabs = !editorConfig.get('insertSpaces') as boolean;

                // Format the document and return edit to replace entire content
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

/**
 * Main formatting function for Silverfin templates
 * Processes each line and handles different tag types with proper indentation
 */
function formatSilverfin(text: string, config: FormatterConfig): string {
    const rawLines = text.replace(/\r\n/g, '\n').split('\n');
    const output: string[] = [];
    let indentLevel = 0;
    let captureLevel = 0;

    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        let completeTag: string | undefined;
        let cleanedLine: string | undefined;

        if (line.length === 0) {
            output.push('');
            continue;
        }
        else if (line.search(/({%|{{|{:|<)/) === -1) {
            output.push(setIndent(line, indentLevel, config));
            continue;
        }
        else {
            // Handle special cases that span multiple lines
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

        // Clean HTML, Liquid, and Markdown from the tag
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

/**
 * Handles stripnewlines blocks, which may contain markdown tables
 * Returns information about whether the block was handled and content
 */
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
        // Check if this is a markdown table (starts with pipe and has newline tags)
        if (currentLine.trim().indexOf('|') === 0)
            startsWithPipe = true;
        if (startsWithPipe && currentLine.search(/{%\s*newline\s*%}/) !== -1) {
            inMarkdownTable = true;
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

/**
 * Handles IC (Internal Control) blocks by combining all lines into a single tag
 * Returns the complete IC block content and updated index
 */
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

/**
 * Handles incomplete tags that span multiple lines
 * Combines lines until the tag is complete (has proper closing)
 */
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

/**
 * Processes a cleaned line by handling all tags within it
 * Continues processing until the entire line is consumed
 */
function processCleanedLine(cleanedLine: string, captureLevel: number, indentLevel: number, config: FormatterConfig, output: string[], rawLines: string[], currentIndex: number): { indentLevel: number; captureLevel: number } {
    let currentIndentLevel = indentLevel;
    let currentCaptureLevel = captureLevel;
    let remainingLine = cleanedLine;

    // Process all tags in the line until nothing remains
    while (remainingLine !== '') {
        remainingLine = remainingLine.trim();
        
        // Handle capture mode differently than normal mode
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

/**
 * Processes content when inside a capture block
 * Capture blocks require special handling for nested tags and proper closure
 */
function processCaptureMode(cleanedLine: string, captureLevel: number, indentLevel: number, config: FormatterConfig, output: string[]): { captureLevel: number; indentLevel: number; remainingLine: string } {
    let currentCaptureLevel = captureLevel;
    let currentIndentLevel = indentLevel;

    // Count opening and closing capture tags to track nesting
    let matches = cleanedLine.match(/{%\s*capture\s*%}/g);
    let countOpen = matches ? matches.length : 0;

    matches = cleanedLine.match(/{%\s*endcapture\s*%}/g);
    let countClose = matches ? matches.length : 0;
    currentCaptureLevel += countOpen - countClose;

    // If we've closed all capture blocks, handle the endcapture
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
        // Handle nested tags within capture blocks
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

/**
 * Processes content in normal mode (not inside capture blocks)
 * Routes to specific handlers based on tag type
 */
function processNormalMode(cleanedLine: string, indentLevel: number, captureLevel: number, config: FormatterConfig, output: string[], rawLines: string[], currentIndex: number): { indentLevel: number; captureLevel: number; remainingLine: string } {
    let currentIndentLevel = indentLevel;
    let currentCaptureLevel = captureLevel;

    // Route to appropriate handler based on tag type
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

/**
 * Processes HTML tags and determines indentation behavior
 * Handles single tags, inline tags, and block tags differently
 */
function processHtmlTag(cleanedLine: string, indentLevel: number, config: FormatterConfig, output: string[]): { indentLevel: number; captureLevel: number; remainingLine: string } {
    let currentIndentLevel = indentLevel;
    let htmlTag: string = '';
    // Extract tag name (handle both opening and closing tags)
    if (cleanedLine.indexOf('/') !== 1) {
        htmlTag = cleanedLine.substring(1, cleanedLine.search('>'));
    } else {
        htmlTag = cleanedLine.substring(2, cleanedLine.search('>'));
    }

    // Handle different types of HTML tags
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

/**
 * Processes markdown-style tags that start with {:
 */
function processMarkdownTag(cleanedLine: string, output: string[]): { captureLevel: number; remainingLine: string } {
    let markdownTag = cleanedLine.substring(0, cleanedLine.search('}') + 1);
    output.push(markdownTag.trim());
    let remainingLine = cleanedLine.substring(cleanedLine.search('}') + 1).trim();
    return { captureLevel: 0, remainingLine };
}

/**
 * Processes content that appears before tags on a line
 * Splits content from tags for separate handling
 */
function processContentBeforeTag(cleanedLine: string, indentLevel: number, config: FormatterConfig, output: string[]): { indentLevel: number; captureLevel: number; remainingLine: string } {
    let contentBeforeTag = cleanedLine.slice(0, cleanedLine.search(/({%|{{|<)/));
    if (contentBeforeTag.trim().length > 0) {
        output.push(setIndent(contentBeforeTag, indentLevel, config));
    }
    let remainingLine = cleanedLine.slice(cleanedLine.search(/({%|{{|<)/)).trim();
    return { indentLevel, captureLevel: 0, remainingLine };
}

/**
 * Processes Liquid tags ({% %} and {{ }})
 * Handles logic blocks, capture blocks, and single-line tags with appropriate indentation
 */
function processLiquidTag(cleanedLine: string, indentLevel: number, captureLevel: number, config: FormatterConfig, output: string[], rawLines: string[], currentIndex: number): { indentLevel: number; captureLevel: number; remainingLine: string } {
    let currentIndentLevel = indentLevel;
    let currentCaptureLevel = captureLevel;

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
    
    // Handle different types of Liquid tags
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

/**
 * Cleans HTML tags by normalizing whitespace and attribute formatting
 */
function cleanHtml(line: string): string {
    return line.replace(/<[^>]*>/g, tag =>
        tag.replace(/<\s+/g, '<').replace(/\s+>/g, '>').replace(/\s*(class|colspan)\s*=\s*/g, ' $1=')
    );
}

/**
 * Cleans Liquid tags by removing extra whitespace
 */
function cleanLiquid(line: string): string {
    return line.replace(/^\s*({{.*?}}|{%-.*?-%})\s*$/, '$1');
}

/**
 * Cleans markdown formatting by removing extra whitespace
 */
function cleanMarkdown(line: string): string {
    return line.replace(/^\s*(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_)\s*$/, '$1');
}

/**
 * Adds proper indentation to a line based on the current level and configuration
 */
function setIndent(line: string, level: number, config: FormatterConfig): string {
    const indent = config.padWithTabs ? '\t'.repeat(level) : ' '.repeat(config.tabSize * level);
    return indent + line;
}