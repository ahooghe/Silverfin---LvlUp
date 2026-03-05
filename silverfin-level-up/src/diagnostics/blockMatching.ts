import * as vscode from 'vscode';
import { TagInstance, createDiagnostic, getCommentRanges, isInCommentRange, LIQUID_BLOCK_TAGS, MARKDOWN_BLOCK_TAGS, HTML_BLOCK_TAGS } from './helpers';

export function checkLiquidBlockMatching(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const tagRegex = /\{%-?\s*(end)?(\w+)\b.*?-?%\}/g;
    const openStacks: Map<string, TagInstance[]> = new Map();
    for (const tag of LIQUID_BLOCK_TAGS) { openStacks.set(tag, []); }
    const subBlocks = ['else', 'elsif', 'elsifi', 'when'];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        let match: RegExpExecArray | null;
        tagRegex.lastIndex = 0;
        while ((match = tagRegex.exec(line)) !== null) {
            const isEnd = !!match[1];
            const tagName = match[2].toLowerCase();
            if (subBlocks.includes(tagName) || !LIQUID_BLOCK_TAGS.includes(tagName)) { continue; }
            const startChar = match.index;
            const endChar = match.index + match[0].length;
            if (isEnd) {
                const stack = openStacks.get(tagName)!;
                if (stack.length === 0) {
                    diagnostics.push(createDiagnostic(lineIndex, startChar, lineIndex, endChar,
                        `Unexpected {% end${tagName} %} \u2014 no matching opening {% ${tagName} %} found.`, vscode.DiagnosticSeverity.Error));
                } else { stack.pop(); }
            } else {
                openStacks.get(tagName)!.push({ name: tagName, line: lineIndex, startChar, endChar });
            }
        }
    }

    for (const [tagName, stack] of openStacks) {
        for (const tag of stack) {
            diagnostics.push(createDiagnostic(tag.line, tag.startChar, tag.line, tag.endChar,
                `Unclosed {% ${tagName} %} \u2014 missing {% end${tagName} %}.`, vscode.DiagnosticSeverity.Error));
        }
    }
    return diagnostics;
}

export function checkMarkdownBlockMatching(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const openRegex = /\{::(\w+)(?:\s[^}]*)?\}/g;
    const closeRegex = /\{:\/(\w+)\}/g;
    const openStacks: Map<string, TagInstance[]> = new Map();
    const pairedTags = MARKDOWN_BLOCK_TAGS.filter(t => t !== 'group');
    for (const tag of pairedTags) { openStacks.set(tag, []); }

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        let match: RegExpExecArray | null;

        openRegex.lastIndex = 0;
        while ((match = openRegex.exec(line)) !== null) {
            const tagName = match[1].toLowerCase();
            if (!pairedTags.includes(tagName)) { continue; }
            const closingPattern = new RegExp(`\\{:/${tagName}\\}`);
            if (closingPattern.test(line.substring(match.index + match[0].length)) ||
                closingPattern.test(line.substring(0, match.index))) { continue; }
            openStacks.get(tagName)!.push({ name: tagName, line: lineIndex, startChar: match.index, endChar: match.index + match[0].length });
        }

        closeRegex.lastIndex = 0;
        while ((match = closeRegex.exec(line)) !== null) {
            const tagName = match[1].toLowerCase();
            if (!pairedTags.includes(tagName)) { continue; }
            const openPattern = new RegExp(`\\{::${tagName}(?:\\s[^}]*)?\\}`);
            if (openPattern.test(line.substring(0, match.index))) { continue; }
            const stack = openStacks.get(tagName);
            if (!stack || stack.length === 0) {
                diagnostics.push(createDiagnostic(lineIndex, match.index, lineIndex, match.index + match[0].length,
                    `Unexpected {:/${tagName}} \u2014 no matching opening {::${tagName}} found.`, vscode.DiagnosticSeverity.Error));
            } else { stack.pop(); }
        }
    }

    for (const [tagName, stack] of openStacks) {
        for (const tag of stack) {
            diagnostics.push(createDiagnostic(tag.line, tag.startChar, tag.line, tag.endChar,
                `Unclosed {::${tagName}} \u2014 missing {:/${tagName}}.`, vscode.DiagnosticSeverity.Error));
        }
    }
    return diagnostics;
}

export function checkGroupTagPairing(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const groupRegex = /\{(?:::group|:\/group)\}/g;
    let lastType: 'open' | 'close' | null = null;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        let match: RegExpExecArray | null;
        groupRegex.lastIndex = 0;
        while ((match = groupRegex.exec(line)) !== null) {
            const isClose = match[0] === '{:/group}';
            const currentType = isClose ? 'close' : 'open';
            if (lastType !== null && lastType === currentType) {
                const label = isClose ? '{:/group}' : '{::group}';
                diagnostics.push(createDiagnostic(lineIndex, match.index, lineIndex, match.index + match[0].length,
                    `Consecutive ${label} \u2014 expected ${isClose ? '{::group}' : '{:/group}'} before this.`, vscode.DiagnosticSeverity.Warning));
            }
            lastType = currentType;
        }
    }
    return diagnostics;
}

export function checkHtmlBlockMatching(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);
    const openRegex = /<(\w+)(?:\s[^>]*)?\s*>/gi;
    const closeRegex = /<\/(\w+)\s*>/gi;
    const openStack: TagInstance[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (isInCommentRange(lineIndex, commentRanges)) { continue; }
        const line = lines[lineIndex];
        const lineTags: { isClose: boolean; name: string; start: number; end: number }[] = [];
        let match: RegExpExecArray | null;

        openRegex.lastIndex = 0;
        while ((match = openRegex.exec(line)) !== null) {
            const tagName = match[1].toLowerCase();
            if (HTML_BLOCK_TAGS.includes(tagName)) {
                lineTags.push({ isClose: false, name: tagName, start: match.index, end: match.index + match[0].length });
            }
        }
        closeRegex.lastIndex = 0;
        while ((match = closeRegex.exec(line)) !== null) {
            const tagName = match[1].toLowerCase();
            if (HTML_BLOCK_TAGS.includes(tagName)) {
                lineTags.push({ isClose: true, name: tagName, start: match.index, end: match.index + match[0].length });
            }
        }
        lineTags.sort((a, b) => a.start - b.start);

        for (const tag of lineTags) {
            if (tag.isClose) {
                const idx = findLastOpenTag(openStack, tag.name);
                if (idx === -1) {
                    diagnostics.push(createDiagnostic(lineIndex, tag.start, lineIndex, tag.end,
                        `Unexpected </${tag.name}> \u2014 no matching opening <${tag.name}> found.`, vscode.DiagnosticSeverity.Error));
                } else { openStack.splice(idx, 1); }
            } else {
                openStack.push({ name: tag.name, line: lineIndex, startChar: tag.start, endChar: tag.end });
            }
        }
    }

    for (const tag of openStack) {
        diagnostics.push(createDiagnostic(tag.line, tag.startChar, tag.line, tag.endChar,
            `Unclosed <${tag.name}> \u2014 missing </${tag.name}>.`, vscode.DiagnosticSeverity.Error));
    }
    return diagnostics;
}

export function checkIcNicNesting(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);
    const tagRegex = /\{%-?\s*(end)?(ic|nic)\b.*?-?%\}/g;
    const stack: { tag: string; line: number }[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (isInCommentRange(lineIndex, commentRanges)) { continue; }
        const line = lines[lineIndex];
        tagRegex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = tagRegex.exec(line)) !== null) {
            const isEnd = !!match[1];
            const tag = match[2].toLowerCase();
            const start = match.index;
            const end = match.index + match[0].length;

            if (isEnd) {
                if (stack.length > 0 && stack[stack.length - 1].tag === tag) { stack.pop(); }
            } else {
                if (stack.length > 0) {
                    const parent = stack[stack.length - 1].tag;
                    if (parent !== tag) {
                        diagnostics.push(createDiagnostic(lineIndex, start, lineIndex, end,
                            `{% ${tag} %} inside {% ${parent} %} \u2014 ic and nic blocks cannot be nested inside each other.`,
                            vscode.DiagnosticSeverity.Error));
                    } else {
                        diagnostics.push(createDiagnostic(lineIndex, start, lineIndex, end,
                            `Nested {% ${tag} %} \u2014 already inside a {% ${tag} %} block (line ${stack[stack.length - 1].line + 1}).`,
                            vscode.DiagnosticSeverity.Warning));
                    }
                }
                stack.push({ tag, line: lineIndex });
            }
        }
    }

    return diagnostics;
}

function findLastOpenTag(stack: TagInstance[], tagName: string): number {
    for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === tagName) { return i; }
    }
    return -1;
}

export function checkSubBlockOrdering(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);
    const tagRegex = /\{%-?\s*(end)?(\w+)\b.*?-?%\}/g;

    interface BlockState {
        tagName: string;
        hasElse: boolean;
    }

    const stack: BlockState[] = [];
    const elseParents = ['if', 'ifi', 'unless', 'for', 'fori'];
    const elsifParents = ['if', 'ifi', 'unless'];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (isInCommentRange(lineIndex, commentRanges)) { continue; }
        const line = lines[lineIndex];
        tagRegex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = tagRegex.exec(line)) !== null) {
            const isEnd = !!match[1];
            const tag = match[2].toLowerCase();
            const start = match.index;
            const end = match.index + match[0].length;

            if (isEnd) {
                if (stack.length > 0 && stack[stack.length - 1].tagName === tag) {
                    stack.pop();
                }
            } else if (tag === 'else') {
                const parent = stack.length > 0 ? stack[stack.length - 1] : null;
                if (!parent || !elseParents.includes(parent.tagName)) {
                    diagnostics.push(createDiagnostic(lineIndex, start, lineIndex, end,
                        `Orphan {% else %} \u2014 not inside an {% if %}, {% unless %}, or {% for %} block.`,
                        vscode.DiagnosticSeverity.Error));
                } else if (parent.hasElse) {
                    diagnostics.push(createDiagnostic(lineIndex, start, lineIndex, end,
                        `Duplicate {% else %} \u2014 only one is allowed per {% ${parent.tagName} %} block.`,
                        vscode.DiagnosticSeverity.Error));
                } else {
                    parent.hasElse = true;
                }
            } else if (tag === 'elsif' || tag === 'elsifi') {
                const parent = stack.length > 0 ? stack[stack.length - 1] : null;
                if (!parent || !elsifParents.includes(parent.tagName)) {
                    diagnostics.push(createDiagnostic(lineIndex, start, lineIndex, end,
                        `Orphan {% ${tag} %} \u2014 not inside an {% if %} or {% unless %} block.`,
                        vscode.DiagnosticSeverity.Error));
                } else if (parent.hasElse) {
                    diagnostics.push(createDiagnostic(lineIndex, start, lineIndex, end,
                        `{% ${tag} %} after {% else %} \u2014 else must be the last branch.`,
                        vscode.DiagnosticSeverity.Error));
                }
            } else if (tag === 'when') {
                const parent = stack.length > 0 ? stack[stack.length - 1] : null;
                if (!parent || parent.tagName !== 'case') {
                    diagnostics.push(createDiagnostic(lineIndex, start, lineIndex, end,
                        `Orphan {% when %} \u2014 not inside a {% case %} block.`,
                        vscode.DiagnosticSeverity.Error));
                }
            } else if (LIQUID_BLOCK_TAGS.includes(tag)) {
                stack.push({ tagName: tag, hasElse: false });
            }
        }
    }

    return diagnostics;
}