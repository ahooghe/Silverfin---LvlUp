import * as vscode from 'vscode';
import { createDiagnostic, getCommentRanges, isInCommentRange, KNOWN_TAGS } from './helpers';

export function checkUnclosedLiquidTags(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (isInCommentRange(lineIndex, commentRanges)) { continue; }
        const line = lines[lineIndex];

        let searchPos = 0;
        while (true) {
            const openIdx = line.indexOf('{%', searchPos);
            if (openIdx === -1) { break; }
            const closeIdx = line.indexOf('%}', openIdx + 2);
            if (closeIdx === -1) {
                if (!isMultiLineTag(lines, lineIndex, '{%', '%}')) {
                    diagnostics.push(createDiagnostic(lineIndex, openIdx, lineIndex, openIdx + 2,
                        'Unclosed Liquid tag \u2014 missing closing %}.', vscode.DiagnosticSeverity.Error));
                }
                break;
            }
            searchPos = closeIdx + 2;
        }

        searchPos = 0;
        while (true) {
            const openIdx = line.indexOf('{{', searchPos);
            if (openIdx === -1) { break; }
            if (line[openIdx + 1] === '%' || (openIdx > 0 && line[openIdx - 1] === '%')) {
                searchPos = openIdx + 2; continue;
            }
            const closeIdx = line.indexOf('}}', openIdx + 2);
            if (closeIdx === -1) {
                if (!isMultiLineTag(lines, lineIndex, '{{', '}}')) {
                    diagnostics.push(createDiagnostic(lineIndex, openIdx, lineIndex, openIdx + 2,
                        'Unclosed Liquid output tag \u2014 missing closing }}.', vscode.DiagnosticSeverity.Error));
                }
                break;
            }
            searchPos = closeIdx + 2;
        }
    }
    return diagnostics;
}

export function checkOrphanClosingDelimiters(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (isInCommentRange(lineIndex, commentRanges)) { continue; }
        const line = lines[lineIndex];

        // Orphan %}
        let searchPos = 0;
        while (true) {
            const closeIdx = line.indexOf('%}', searchPos);
            if (closeIdx === -1) { break; }
            const before = line.substring(0, closeIdx);
            const lastOpen = before.lastIndexOf('{%');
            if (lastOpen === -1 || before.indexOf('%}', lastOpen + 2) !== -1) {
                if (!isOrphanFromMultiLine(lines, lineIndex, '{%', '%}')) {
                    const beforeClose = line.substring(0, closeIdx).trimEnd();
                    const wordMatch = beforeClose.match(/(\S+)\s*$/);
                    const highlightStart = wordMatch ? beforeClose.length - wordMatch[1].length : closeIdx;
                    diagnostics.push(createDiagnostic(lineIndex, highlightStart, lineIndex, closeIdx + 2,
                        'Orphan %} \u2014 missing opening {%.', vscode.DiagnosticSeverity.Error));
                }
            }
            searchPos = closeIdx + 2;
        }

        // Orphan }}
        searchPos = 0;
        while (true) {
            const closeIdx = line.indexOf('}}', searchPos);
            if (closeIdx === -1) { break; }
            if (closeIdx > 0 && line[closeIdx - 1] === '%') { searchPos = closeIdx + 2; continue; }
            const before = line.substring(0, closeIdx);
            const lastOpen = before.lastIndexOf('{{');
            if (lastOpen === -1 || before.indexOf('}}', lastOpen + 2) !== -1) {
                if (!isOrphanFromMultiLine(lines, lineIndex, '{{', '}}')) {
                    const beforeClose = line.substring(0, closeIdx).trimEnd();
                    const wordMatch = beforeClose.match(/(\S+)\s*$/);
                    const highlightStart = wordMatch ? beforeClose.length - wordMatch[1].length : closeIdx;
                    diagnostics.push(createDiagnostic(lineIndex, highlightStart, lineIndex, closeIdx + 2,
                        'Orphan }} \u2014 missing opening {{.', vscode.DiagnosticSeverity.Error));
                }
            }
            searchPos = closeIdx + 2;
        }

        // Unknown tag keywords
        const tagRegex = /\{%-?\s*(\w+)\b.*?-?%\}/g;
        let tagMatch: RegExpExecArray | null;
        tagRegex.lastIndex = 0;
        while ((tagMatch = tagRegex.exec(line)) !== null) {
            const keyword = tagMatch[1].toLowerCase();
            if (!KNOWN_TAGS.includes(keyword)) {
                const keyStart = tagMatch.index + tagMatch[0].indexOf(tagMatch[1]);
                const keyEnd = keyStart + tagMatch[1].length;
                diagnostics.push(createDiagnostic(lineIndex, keyStart, lineIndex, keyEnd,
                    `Unknown Liquid tag "{% ${keyword} %}" \u2014 not a recognized Silverfin tag.`, vscode.DiagnosticSeverity.Error));
            }
        }
    }
    return diagnostics;
}

export function checkEmptyTags(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);
    const emptyLiquidTag = /\{%-?\s*-?%\}/g;
    const emptyOutputTag = /\{\{\s*\}\}/g;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (isInCommentRange(lineIndex, commentRanges)) { continue; }
        const line = lines[lineIndex];
        let match: RegExpExecArray | null;

        emptyLiquidTag.lastIndex = 0;
        while ((match = emptyLiquidTag.exec(line)) !== null) {
            diagnostics.push(createDiagnostic(lineIndex, match.index, lineIndex, match.index + match[0].length,
                'Empty Liquid tag \u2014 tag body is blank.', vscode.DiagnosticSeverity.Error));
        }
        emptyOutputTag.lastIndex = 0;
        while ((match = emptyOutputTag.exec(line)) !== null) {
            diagnostics.push(createDiagnostic(lineIndex, match.index, lineIndex, match.index + match[0].length,
                'Empty output tag \u2014 no variable or expression specified.', vscode.DiagnosticSeverity.Error));
        }
    }
    return diagnostics;
}

function isMultiLineTag(lines: string[], startLine: number, openDelim: string, closeDelim: string): boolean {
    for (let i = startLine + 1; i < Math.min(startLine + 5, lines.length); i++) {
        if (lines[i].includes(closeDelim)) { return true; }
        if (lines[i].includes(openDelim)) { return false; }
    }
    return false;
}

function isOrphanFromMultiLine(lines: string[], currentLine: number, openDelim: string, closeDelim: string): boolean {
    for (let i = currentLine - 1; i >= Math.max(0, currentLine - 5); i--) {
        if (lines[i].includes(openDelim)) {
            const lastOpen = lines[i].lastIndexOf(openDelim);
            const closeAfter = lines[i].indexOf(closeDelim, lastOpen + 2);
            if (closeAfter === -1) { return true; }
        }
        if (lines[i].includes(closeDelim)) { return false; }
    }
    return false;
}