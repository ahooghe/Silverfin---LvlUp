import * as vscode from 'vscode';

export interface TagInstance {
    name: string;
    line: number;
    startChar: number;
    endChar: number;
}

export interface LineRange {
    start: number;
    end: number;
}

export function createDiagnostic(
    startLine: number, startChar: number,
    endLine: number, endChar: number,
    message: string,
    severity: vscode.DiagnosticSeverity
): vscode.Diagnostic {
    const range = new vscode.Range(startLine, startChar, endLine, endChar);
    const diagnostic = new vscode.Diagnostic(range, message, severity);
    diagnostic.source = 'Silverfin';
    return diagnostic;
}

export function getCommentRanges(lines: string[]): LineRange[] {
    const ranges: LineRange[] = [];
    let commentStart = -1;

    for (let i = 0; i < lines.length; i++) {
        if (commentStart === -1 && /\{%-?\s*comment\s*-?%\}/.test(lines[i])) {
            commentStart = i;
        }
        if (commentStart !== -1 && /\{%-?\s*endcomment\s*-?%\}/.test(lines[i])) {
            ranges.push({ start: commentStart + 1, end: i - 1 });
            commentStart = -1;
        }
    }

    return ranges;
}

export function isInCommentRange(line: number, ranges: LineRange[]): boolean {
    return ranges.some(r => line >= r.start && line <= r.end);
}

// Block tags that require matching open/close pairs
export const LIQUID_BLOCK_TAGS = [
    'if', 'ifi', 'for', 'fori', 'unless', 'case', 'capture',
    'ic', 'nic', 'comment', 'stripnewlines',
    'locale', 'radiogroup', 'currencyconfiguration', 'adjustmentbutton', 'addnewinputs',
    'linkto'
];

// Markdown-style tags that require matching open/close pairs
export const MARKDOWN_BLOCK_TAGS = [
    'infotext', 'warningtext', 'cautiontext',
    'font', 'indent', 'target'
];

// HTML tags that require matching open/close pairs
export const HTML_BLOCK_TAGS = ['table', 'thead', 'tbody', 'tr', 'td', 'th'];

// All known Liquid tag keywords
export const KNOWN_TAGS = [
    'if', 'endif', 'ifi', 'endifi', 'for', 'endfor', 'fori', 'endfori',
    'unless', 'endunless', 'case', 'endcase', 'capture', 'endcapture',
    'ic', 'endic', 'nic', 'endnic', 'comment', 'endcomment',
    'stripnewlines', 'endstripnewlines', 'locale', 'endlocale',
    'radiogroup', 'endradiogroup', 'currencyconfiguration', 'endcurrencyconfiguration',
    'adjustmentbutton', 'endadjustmentbutton', 'addnewinputs', 'endaddnewinputs',
    'linkto', 'endlinkto',
    'else', 'elsif', 'elsifi', 'when',
    'assign', 'input', 'result', 'push', 'pop', 'newpage', 'include',
    'changeorientation', 't', 't=', 'unreconciled', 'newline',
    'signmarker', 'rollforward', 'adjustmenttransaction', 'radioinput',
    'input_validation', 'add_new_row_button'
];