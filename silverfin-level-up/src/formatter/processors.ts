import { FormatterConfig } from './config';
import { setIndent } from './helpers';

export function processCleanedLine(cleanedLine: string, indentLevel: number, config: FormatterConfig, output: string[], rawLines: string[], currentIndex: number): { indentLevel: number } {
    let currentIndentLevel = indentLevel;
    let remainingLine = cleanedLine;

    while (remainingLine !== '') {
        remainingLine = remainingLine.trim();
        const normalResult = processNormalMode(remainingLine, currentIndentLevel, config, output, rawLines, currentIndex);
        currentIndentLevel = normalResult.indentLevel;
        remainingLine = normalResult.remainingLine;
    }

    return { indentLevel: currentIndentLevel };
}

function processNormalMode(cleanedLine: string, indentLevel: number, config: FormatterConfig, output: string[], rawLines: string[], currentIndex: number): { indentLevel: number; remainingLine: string } {
    let currentIndentLevel = indentLevel;

    if (cleanedLine.search('<') === 0) {
        return processHtmlTag(cleanedLine, currentIndentLevel, config, output);
    }
    else if (cleanedLine.search('{:') === 0 && cleanedLine.search('}') !== -1) {
        const markdownResult = processMarkdownTag(cleanedLine, currentIndentLevel, config, output);
        return { indentLevel: currentIndentLevel, remainingLine: markdownResult.remainingLine };
    }
    else if (cleanedLine.search(/({%|{{|<)/) === -1) {
        output.push(setIndent(cleanedLine, currentIndentLevel, config));
        return { indentLevel: currentIndentLevel, remainingLine: '' };
    }
    else if (cleanedLine.search(/({%|{{|<)/) > 0) {
        return processContentBeforeTag(cleanedLine, currentIndentLevel, config, output);
    } else {
        return processLiquidTag(cleanedLine, currentIndentLevel, config, output, rawLines, currentIndex);
    }
}

function processHtmlTag(cleanedLine: string, indentLevel: number, config: FormatterConfig, output: string[]): { indentLevel: number; remainingLine: string } {
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
        return { indentLevel: currentIndentLevel, remainingLine };
    } else if (config.htmlInlineTags.includes(htmlTag)) {
        const closingTagPattern = new RegExp(`</${htmlTag}>`, 'i');
        const closingTagIndex: number = cleanedLine.search(closingTagPattern);
        if (closingTagIndex !== -1) {
            let closingTag = cleanedLine.substring(0, closingTagIndex + `</${htmlTag}>`.length);
            let remainingLine = cleanedLine.substring(closingTagIndex + `</${htmlTag}>`.length).trim();
            output.push(setIndent(closingTag, currentIndentLevel, config));
            return { indentLevel: currentIndentLevel, remainingLine };
        } else {
            output.push(setIndent(cleanedLine, currentIndentLevel, config));
            return { indentLevel: currentIndentLevel, remainingLine: '' };
        }
    } else {
        let fullHTMLTag = cleanedLine.substring(0, cleanedLine.search('>') + 1);
        let remainingLine = cleanedLine.substring(cleanedLine.search('>') + 1).trim();
        if (fullHTMLTag.indexOf('</') !== -1) {
            currentIndentLevel--;
            if (currentIndentLevel < 0) { currentIndentLevel = 0; }
            output.push(setIndent(fullHTMLTag, currentIndentLevel, config));
        } else {
            output.push(setIndent(fullHTMLTag, currentIndentLevel, config));
            currentIndentLevel++;
        }
        return { indentLevel: currentIndentLevel, remainingLine };
    }
}

function processMarkdownTag(cleanedLine: string, indentLevel: number, config: FormatterConfig, output: string[]): { remainingLine: string } {
    let markdownTag = cleanedLine.substring(0, cleanedLine.search('}') + 1);
    const structuralTags = ['group', 'infotext', 'cautiontext', 'warningtext'];

    if (markdownTag.startsWith('{::')) {
        const inner = markdownTag.substring(3, markdownTag.length - 1);
        const tagName = inner.split(/\s/)[0];
        const isStructural = structuralTags.includes(tagName);
        const effectiveIndent = isStructural ? 0 : indentLevel;
        const closingTag = '{:/' + tagName + '}';
        const closingIdx = cleanedLine.indexOf(closingTag);
        if (closingIdx !== -1) {
            const contentBetween = cleanedLine.substring(markdownTag.length, closingIdx).trim();
            const fullBlock = markdownTag + contentBetween + closingTag;
            const remaining = cleanedLine.substring(closingIdx + closingTag.length).trim();
            output.push(setIndent(fullBlock, effectiveIndent, config));
            return { remainingLine: remaining };
        }
        output.push(setIndent(markdownTag.trim(), effectiveIndent, config));
        let remainingLine = cleanedLine.substring(cleanedLine.search('}') + 1).trim();
        return { remainingLine };
    }

    if (markdownTag.startsWith('{:/')) {
        const tagName = markdownTag.substring(3, markdownTag.length - 1);
        const isStructural = structuralTags.includes(tagName);
        const effectiveIndent = isStructural ? 0 : indentLevel;
        output.push(setIndent(markdownTag.trim(), effectiveIndent, config));
        let remainingLine = cleanedLine.substring(cleanedLine.search('}') + 1).trim();
        return { remainingLine };
    }

    output.push(setIndent(markdownTag.trim(), indentLevel, config));
    let remainingLine = cleanedLine.substring(cleanedLine.search('}') + 1).trim();
    return { remainingLine };
}

function processContentBeforeTag(cleanedLine: string, indentLevel: number, config: FormatterConfig, output: string[]): { indentLevel: number; remainingLine: string } {
    let contentBeforeTag = cleanedLine.slice(0, cleanedLine.search(/({%|{{|<)/)).trimEnd();
    if (contentBeforeTag.trim().length > 0) {
        output.push(setIndent(contentBeforeTag, indentLevel, config));
    }
    let remainingLine = cleanedLine.slice(cleanedLine.search(/({%|{{|<)/)).trim();
    return { indentLevel, remainingLine };
}

function processLiquidTag(cleanedLine: string, indentLevel: number, config: FormatterConfig, output: string[], rawLines: string[], currentIndex: number): { indentLevel: number; remainingLine: string } {
    let currentIndentLevel = indentLevel;

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

    // Single-line capture
    if (tagId === 'capture') {
        const endIdx = cleanedLine.search(/{%-?\s*endcapture\s*-?%}/);
        if (endIdx !== -1) {
            const endTagClose = cleanedLine.indexOf('%}', endIdx) + 2;
            const fullCapture = tag + cleanedLine.substring(0, endTagClose);
            const remaining = cleanedLine.substring(endTagClose).trim();
            output.push(setIndent(fullCapture, currentIndentLevel, config));
            return { indentLevel: currentIndentLevel, remainingLine: remaining };
        }
    }

    // Linkto must always be single-line
    if (tagId === 'linkto') {
        const endIdx = cleanedLine.search(/{%-?\s*endlinkto\s*-?%}/);
        if (endIdx !== -1) {
            const endTagClose = cleanedLine.indexOf('%}', endIdx) + 2;
            const fullLinkto = tag + cleanedLine.substring(0, endTagClose);
            const remaining = cleanedLine.substring(endTagClose).trim();
            output.push(setIndent(fullLinkto, currentIndentLevel, config));
            return { indentLevel: currentIndentLevel, remainingLine: remaining };
        }
        output.push(setIndent(tag + cleanedLine, currentIndentLevel, config));
        return { indentLevel: currentIndentLevel, remainingLine: '' };
    }

    if (tag.startsWith('{{') || config.singleLineLogicTags.includes(tagId)) {
        output.push(setIndent(tag, currentIndentLevel, config));
    } else if (config.logicBlocks.includes(tagId) || config.liquidBlocks.includes(tagId)) {
        output.push(setIndent(tag, currentIndentLevel, config));
        currentIndentLevel++;
    } else if (config.logicSubBlocks.includes(tagId)) {
        currentIndentLevel--;
        if (currentIndentLevel < 0) { currentIndentLevel = 0; }
        output.push(setIndent(tag, currentIndentLevel, config));
        currentIndentLevel++;
    } else {
        currentIndentLevel--;
        if (currentIndentLevel < 0) { currentIndentLevel = 0; }
        output.push(setIndent(tag, currentIndentLevel, config));
        if (rawLines[currentIndex + 1] && rawLines[currentIndex + 1].trim().length !== 0 &&
            !(cleanedLine.substring(0, 6) === '{% end' ||
                (cleanedLine === '' && rawLines[currentIndex + 1] && rawLines[currentIndex + 1].trim().substring(0, 6) === '{% end') ||
                cleanedLine.substring(0, 2) === '</' ||
                (cleanedLine === '' && rawLines[currentIndex + 1] && rawLines[currentIndex + 1].trim().substring(0, 2) === '</'))) {
            output.push('');
        }
    }

    return { indentLevel: currentIndentLevel, remainingLine: cleanedLine };
}