import * as vscode from 'vscode';
import { createDiagnostic } from './helpers';

export function checkEmptyBlockBodies(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');

    const blockOpeners = ['if', 'ifi', 'unless', 'for', 'fori', 'case', 'ic', 'nic', 'capture', 'comment'];
    const subBlockTags = ['else', 'elsif', 'elsifi', 'when'];
    const skipOpenerCheck = ['case'];
    const blockMgmtRegex = /\{%-?\s*(end)?(if|ifi|unless|for|fori|case|ic|nic|capture|comment|stripnewlines|locale|radiogroup|currencyconfiguration|adjustmentbutton|addnewinputs|linkto|else|elsif|elsifi|when)\b.*?-?%\}/g;

    interface BlockEntry {
        tagName: string;
        line: number;
        startChar: number;
        endChar: number;
        hasContent: boolean;
    }

    const stack: BlockEntry[] = [];
    const tagRegex = /\{%-?\s*(end)?(if|ifi|unless|for|fori|case|ic|nic|capture|comment|else|elsif|elsifi|when)\b.*?-?%\}/g;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        let match: RegExpExecArray | null;
        tagRegex.lastIndex = 0;

        const strippedLine = line.replace(blockMgmtRegex, '').trim();
        const lineHasContent = strippedLine.length > 0;

        if (lineHasContent && stack.length > 0) {
            stack[stack.length - 1].hasContent = true;
        }

        while ((match = tagRegex.exec(line)) !== null) {
            const isEnd = !!match[1];
            const tagName = match[2].toLowerCase();
            const startChar = match.index;
            const endChar = match.index + match[0].length;

            if (subBlockTags.includes(tagName)) {
                if (stack.length > 0) {
                    const top = stack[stack.length - 1];
                    const isOpenerSection = blockOpeners.includes(top.tagName) && skipOpenerCheck.includes(top.tagName);
                    if (!top.hasContent && !isOpenerSection) {
                        diagnostics.push(createDiagnostic(top.line, top.startChar, top.line, top.endChar,
                            `Empty block body \u2014 no content inside {% ${top.tagName} %}.`, vscode.DiagnosticSeverity.Warning));
                    }
                    stack[stack.length - 1] = { tagName, line: lineIndex, startChar, endChar, hasContent: false };
                }
            } else if (isEnd) {
                if (stack.length > 0) {
                    const top = stack[stack.length - 1];
                    const parentTag = tagName;
                    if (!top.hasContent) {
                        diagnostics.push(createDiagnostic(top.line, top.startChar, top.line, top.endChar,
                            `Empty block body \u2014 no content inside {% ${top.tagName} %}.`, vscode.DiagnosticSeverity.Warning));
                    }
                    stack.pop();
                    while (stack.length > 0 && subBlockTags.includes(stack[stack.length - 1].tagName)) { stack.pop(); }
                    if (stack.length > 0 && stack[stack.length - 1].tagName === parentTag) { stack.pop(); }
                }
            } else if (blockOpeners.includes(tagName)) {
                if (stack.length > 0) { stack[stack.length - 1].hasContent = true; }
                const afterOpener = line.substring(endChar).replace(blockMgmtRegex, '').trim();
                stack.push({ tagName, line: lineIndex, startChar, endChar, hasContent: afterOpener.length > 0 });
            }
        }
    }

    diagnostics.push(...checkCaseWithoutWhen(text));
    return diagnostics;
}

function checkCaseWithoutWhen(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const caseRegex = /\{%-?\s*case\b.*?-?%\}/g;
    const endcaseRegex = /\{%-?\s*endcase\s*-?%\}/g;
    const whenRegex = /\{%-?\s*when\b/g;
    let caseTag: { line: number; start: number; end: number } | null = null;
    let hasWhen = false;
    let depth = 0;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        let match: RegExpExecArray | null;

        caseRegex.lastIndex = 0;
        while ((match = caseRegex.exec(line)) !== null) {
            if (depth === 0) { caseTag = { line: lineIndex, start: match.index, end: match.index + match[0].length }; hasWhen = false; }
            depth++;
        }
        if (depth > 0) { whenRegex.lastIndex = 0; if (whenRegex.test(line) && depth === 1) { hasWhen = true; } }

        endcaseRegex.lastIndex = 0;
        while ((match = endcaseRegex.exec(line)) !== null) {
            depth--;
            if (depth === 0 && caseTag && !hasWhen) {
                diagnostics.push(createDiagnostic(caseTag.line, caseTag.start, caseTag.line, caseTag.end,
                    'Case block has no {% when %} clauses.', vscode.DiagnosticSeverity.Warning));
                caseTag = null;
            }
        }
    }
    return diagnostics;
}