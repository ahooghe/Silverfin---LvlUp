import { FormatterConfig } from './config';
import { setIndent } from './helpers';

export function handleStripnewlines(rawLines: string[], currentIndex: number): { handled: boolean; isMarkdownTable: boolean; content: string; nextIndex: number } {
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

export function handleCaptureBlock(rawLines: string[], currentIndex: number, indentLevel: number, config: FormatterConfig): { handled: boolean; content: string; nextIndex: number; indentLevel: number } {
    const line = rawLines[currentIndex];
    if (!/{%-?\s*capture\b/.test(line)) {
        return { handled: false, content: '', nextIndex: currentIndex, indentLevel };
    }

    let i = currentIndex;
    const captureLines: string[] = [];
    let captureDepth = 0;

    while (i < rawLines.length) {
        const currentLine = rawLines[i];
        const openMatches = currentLine.match(/{%-?\s*capture\b/g);
        const closeMatches = currentLine.match(/{%-?\s*endcapture\s*-?%}/g);
        captureDepth += (openMatches ? openMatches.length : 0);
        captureDepth -= (closeMatches ? closeMatches.length : 0);
        captureLines.push(currentLine);
        if (captureDepth <= 0) { break; }
        if (i < rawLines.length - 1) { i++; } else { break; }
    }

    const innerLines = captureLines.slice(1, captureLines.length - 1);
    let minIndent = Infinity;
    for (const il of innerLines) {
        if (il.trim().length === 0) continue;
        const leadingSpaces = il.match(/^(\s*)/)?.[0].length ?? 0;
        if (leadingSpaces < minIndent) minIndent = leadingSpaces;
    }
    if (minIndent === Infinity) minIndent = 0;

    const baseIndent = config.padWithTabs
        ? '\t'.repeat(indentLevel + 1)
        : ' '.repeat(config.tabSize * (indentLevel + 1));

    const result: string[] = [];
    result.push(setIndent(captureLines[0].trimStart(), indentLevel, config));

    for (const il of innerLines) {
        if (il.trim().length === 0) { result.push(''); }
        else { result.push(baseIndent + il.substring(minIndent)); }
    }

    if (captureLines.length > 1) {
        result.push(setIndent(captureLines[captureLines.length - 1].trimStart(), indentLevel, config));
    }

    return { handled: true, content: result.join('\n'), nextIndex: i, indentLevel };
}

export function handleLinktoBlock(rawLines: string[], currentIndex: number): { handled: boolean; content: string; nextIndex: number } {
    const line = rawLines[currentIndex].trim();
    if (!/{%-?\s*linkto\b/.test(line)) {
        return { handled: false, content: '', nextIndex: currentIndex };
    }

    if (/{%-?\s*endlinkto\s*-?%}/.test(line)) {
        return { handled: true, content: line, nextIndex: currentIndex };
    }

    let i = currentIndex;
    let joined = line;
    while (i < rawLines.length - 1) {
        i++;
        const nextLine = rawLines[i].trim();
        if (nextLine.length === 0) continue;
        joined += nextLine;
        if (/{%-?\s*endlinkto\s*-?%}/.test(nextLine)) break;
    }

    return { handled: true, content: joined, nextIndex: i };
}

export function handleIcBlock(rawLines: string[], currentIndex: number): { handled: boolean; content: string; nextIndex: number } {
    const line = rawLines[currentIndex];
    if (line.search(/{%\s*ic\s*%}/) === -1) {
        return { handled: false, content: '', nextIndex: currentIndex };
    }

    // Only collapse single-line IC blocks (ic and endic on same input line)
    if (/{%\s*endic\s*%}/.test(line)) {
        return { handled: true, content: line.trim(), nextIndex: currentIndex };
    }

    // Multi-line IC: let normal formatting process each line individually
    return { handled: false, content: '', nextIndex: currentIndex };
}

export function handleIncompleteTag(rawLines: string[], currentIndex: number): { handled: boolean; content: string; nextIndex: number } {
    const line = rawLines[currentIndex];
    if (line.search(/(%}|}}|>)/) !== -1 || line.trim().search(/^{:/) !== -1) {
        return { handled: false, content: '', nextIndex: currentIndex };
    }

    let i = currentIndex;
    let completeTag = line;
    while (completeTag.search(/(%}|}}|>)/) === -1 && i < rawLines.length - 1) {
        i++;
        const nextLine = rawLines[i].trim();
        if (nextLine.length === 0) { continue; }
        completeTag += ' ' + nextLine;
    }

    return { handled: true, content: completeTag, nextIndex: i };
}