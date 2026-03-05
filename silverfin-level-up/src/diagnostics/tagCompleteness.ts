import * as vscode from 'vscode';
import { createDiagnostic, getCommentRanges, isInCommentRange } from './helpers';

interface TagRule {
    // Regex to match the full tag (must have capture group 1 for the keyword)
    pattern: RegExp;
    message: string;
}

// Tags that require specific arguments after the keyword
const INCOMPLETE_TAG_RULES: TagRule[] = [
    {
        pattern: /\{%-?\s*(capture)\s*-?%\}/g,
        message: '{% capture %} requires a variable name \u2014 e.g. {% capture my_var %}.'
    },
    {
        pattern: /\{%-?\s*(assign)\s*-?%\}/g,
        message: '{% assign %} requires a variable assignment \u2014 e.g. {% assign x = 1 %}.'
    },
    {
        pattern: /\{%-?\s*(assign)\s+\w+\s*-?%\}/g,
        message: '{% assign %} is missing the = operator and value \u2014 e.g. {% assign x = 1 %}.'
    },
    {
        pattern: /\{%-?\s*(assign)\s+\w+\s*=\s*-?%\}/g,
        message: '{% assign %} is missing a value after = \u2014 e.g. {% assign x = 1 %}.'
    },
    {
        pattern: /\{%-?\s*(if)\s*-?%\}/g,
        message: '{% if %} requires a condition \u2014 e.g. {% if balance > 0 %}.'
    },
    {
        pattern: /\{%-?\s*(ifi)\s*-?%\}/g,
        message: '{% ifi %} requires a condition \u2014 e.g. {% ifi balance > 0 %}.'
    },
    {
        pattern: /\{%-?\s*(unless)\s*-?%\}/g,
        message: '{% unless %} requires a condition \u2014 e.g. {% unless total == 0 %}.'
    },
    {
        pattern: /\{%-?\s*(elsif)\s*-?%\}/g,
        message: '{% elsif %} requires a condition \u2014 e.g. {% elsif x > 0 %}.'
    },
    {
        pattern: /\{%-?\s*(elsifi)\s*-?%\}/g,
        message: '{% elsifi %} requires a condition \u2014 e.g. {% elsifi x > 0 %}.'
    },
    {
        pattern: /\{%-?\s*(for)\s*-?%\}/g,
        message: '{% for %} requires a loop variable and collection \u2014 e.g. {% for item in collection %}.'
    },
    {
        pattern: /\{%-?\s*(for)\s+\w+\s*-?%\}/g,
        message: '{% for %} is missing "in collection" \u2014 e.g. {% for item in collection %}.'
    },
    {
        pattern: /\{%-?\s*(fori)\s*-?%\}/g,
        message: '{% fori %} requires a loop variable and collection \u2014 e.g. {% fori item in collection %}.'
    },
    {
        pattern: /\{%-?\s*(fori)\s+\w+\s*-?%\}/g,
        message: '{% fori %} is missing "in collection" \u2014 e.g. {% fori item in collection %}.'
    },
    {
        pattern: /\{%-?\s*(for)\s+in\s+\S+.*?-?%\}/g,
        message: '{% for %} is missing a loop variable before "in" \u2014 e.g. {% for item in collection %}.'
    },
    {
        pattern: /\{%-?\s*(for)\s+\w+\s+in\s*-?%\}/g,
        message: '{% for %} is missing a collection or range after "in" \u2014 e.g. {% for item in collection %} or {% for i in (1..5) %}.'
    },
    {
        pattern: /\{%-?\s*(fori)\s+in\s+\S+.*?-?%\}/g,
        message: '{% fori %} is missing a loop variable before "in" \u2014 e.g. {% fori item in collection %}.'
    },
    {
        pattern: /\{%-?\s*(fori)\s+\w+\s+in\s*-?%\}/g,
        message: '{% fori %} is missing a collection or range after "in" \u2014 e.g. {% fori item in custom.items %}.'
    },
    {
        pattern: /\{%-?\s*(linkto)\s*-?%\}/g,
        message: '{% linkto %} requires a reconciliation path \u2014 e.g. {% linkto period.reconciliations.template_name %}.'
    },
    {
        pattern: /\{%-?\s*(case)\s*-?%\}/g,
        message: '{% case %} requires a variable \u2014 e.g. {% case status %}.'
    },
    {
        pattern: /\{%-?\s*(when)\s*-?%\}/g,
        message: '{% when %} requires a value \u2014 e.g. {% when "draft" %}.'
    },
    {
        pattern: /\{%-?\s*(input)\s*-?%\}/g,
        message: '{% input %} requires a field path \u2014 e.g. {% input custom.field_name %}.'
    },
    {
        pattern: /\{%-?\s*(input)\s+(?:as:|options:|option_values:|default:|placeholder:)\S*.*?-?%\}/g,
        message: '{% input %} is missing a field path before the attributes \u2014 e.g. {% input custom.field_name as:select %}.'
    },
    {
        pattern: /\{%-?\s*(result)\s*-?%\}/g,
        message: '{% result %} requires a result name \u2014 e.g. {% result "total" %}.'
    },
    {
        pattern: /\{%-?\s*(include)\s*-?%\}/g,
        message: '{% include %} requires a shared part name \u2014 e.g. {% include "shared_part_name" %}.'
    },
    {
        pattern: /\{%-?\s*(t)\s*-?%\}/g,
        message: '{% t %} requires a translation key \u2014 e.g. {% t "greeting" %}.'
    },
    {
        pattern: /\{%-?\s*(t=)\s*-?%\}/g,
        message: '{% t= %} requires a translation key and at least one language \u2014 e.g. {% t= "greeting" default:"Hello" %}.'
    },
    {
        pattern: /\{%-?\s*(input_validation)\s*-?%\}/g,
        message: '{% input_validation %} requires a field path and rules \u2014 e.g. {% input_validation custom.field min:0 max:100 %}.'
    },
    {
        pattern: /\{%-?\s*(rollforward)\s*-?%\}/g,
        message: '{% rollforward %} requires a target and a source \u2014 e.g. {% rollforward custom.field.passed custom.field.current %}.'
    },
    {
        pattern: /\{%-?\s*(rollforward)\s+\S+\s*-?%\}/g,
        message: '{% rollforward %} requires both a target and a source \u2014 e.g. {% rollforward custom.field.passed custom.field.current %}.'
    },
    {
        pattern: /\{%-?\s*(locale)\s*-?%\}/g,
        message: '{% locale %} requires a language \u2014 e.g. {% locale "nl" %} or {% locale primary_language %}.'
    },
];

export function checkTagCompleteness(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (isInCommentRange(lineIndex, commentRanges)) { continue; }
        const line = lines[lineIndex];

        for (const rule of INCOMPLETE_TAG_RULES) {
            rule.pattern.lastIndex = 0;
            let match: RegExpExecArray | null;
            while ((match = rule.pattern.exec(line)) !== null) {
                diagnostics.push(createDiagnostic(
                    lineIndex, match.index, lineIndex, match.index + match[0].length,
                    rule.message, vscode.DiagnosticSeverity.Error
                ));
            }
        }
    }

    return diagnostics;
}

export function checkEmptyPipeFilter(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);
    const outputTagRegex = /\{\{(.+?)\}\}/g;
    const assignValRegex = /\{%-?\s*assign\s+\w+\s*=\s*(.+?)\s*-?%\}/g;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (isInCommentRange(lineIndex, commentRanges)) { continue; }
        const line = lines[lineIndex];

        const checkContent = (regex: RegExp) => {
            regex.lastIndex = 0;
            let match: RegExpExecArray | null;
            while ((match = regex.exec(line)) !== null) {
                const content = match[1];
                const contentStart = match.index + match[0].indexOf(content);
                const emptyPipe = /\|\s*\|/g;
                let pipeMatch: RegExpExecArray | null;
                emptyPipe.lastIndex = 0;
                while ((pipeMatch = emptyPipe.exec(content)) !== null) {
                    const absStart = contentStart + pipeMatch.index;
                    diagnostics.push(createDiagnostic(lineIndex, absStart, lineIndex, absStart + pipeMatch[0].length,
                        'Empty filter \u2014 back-to-back pipes with no filter name between them.',
                        vscode.DiagnosticSeverity.Error));
                }
            }
        };

        checkContent(outputTagRegex);
        checkContent(assignValRegex);
    }

    return diagnostics;
}

export function checkDanglingOperators(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);
    const conditionTags = /\{%-?\s*(?:if|ifi|unless|elsif|elsifi)\s+(.*?)\s*-?%\}/g;
    const operators = /\s+(==|!=|<>|>=|<=|>|<|contains)\s*$/;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (isInCommentRange(lineIndex, commentRanges)) { continue; }
        const line = lines[lineIndex];
        conditionTags.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = conditionTags.exec(line)) !== null) {
            const condition = match[1].trim();
            if (operators.test(condition)) {
                const opMatch = condition.match(operators);
                diagnostics.push(createDiagnostic(lineIndex, match.index, lineIndex, match.index + match[0].length,
                    `Condition ends with "${opMatch![1]}" but is missing a value to compare against.`,
                    vscode.DiagnosticSeverity.Error));
            }
        }
    }

    return diagnostics;
}

export function checkTranslationTags(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);
    // Match t/t= tags that have content (empty ones are caught by INCOMPLETE_TAG_RULES)
    const tTagRegex = /\{%-?\s*t(=?)\s+(.+?)\s*-?%\}/g;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (isInCommentRange(lineIndex, commentRanges)) { continue; }
        const line = lines[lineIndex];
        tTagRegex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = tTagRegex.exec(line)) !== null) {
            const tagKeyword = 't' + match[1];
            const content = match[2].trim();
            const start = match.index;
            const end = match.index + match[0].length;

            const isDeclaration = match[1] === '=';
            const hasKey = /^["']/.test(content);
            const hasLanguage = /\b\w+:["']/.test(content);

            if (!hasKey) {
                diagnostics.push(createDiagnostic(lineIndex, start, lineIndex, end,
                    `{% ${tagKeyword} %} is missing a translation key \u2014 e.g. {% ${tagKeyword} "my_key"${isDeclaration ? ' default:"Text"' : ''} %}.`,
                    vscode.DiagnosticSeverity.Error));
            } else if (isDeclaration && !hasLanguage) {
                diagnostics.push(createDiagnostic(lineIndex, start, lineIndex, end,
                    `{% t= %} requires at least one language definition \u2014 e.g. {% t= "my_key" default:"Text" %}.`,
                    vscode.DiagnosticSeverity.Error));
            }
        }
    }

    return diagnostics;
}

const VALID_INPUT_TYPES = [
    'currency', 'integer', 'percentage', 'text', 'text_area', 'textarea',
    'select', 'boolean', 'date', 'file', 'period', 'accounting'
];

export function checkInputAsType(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);
    const inputAsRegex = /\{%-?\s*input\s+\S+.*?\bas:(\w+)/g;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (isInCommentRange(lineIndex, commentRanges)) { continue; }
        const line = lines[lineIndex];
        inputAsRegex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = inputAsRegex.exec(line)) !== null) {
            const asType = match[1].toLowerCase();
            if (!VALID_INPUT_TYPES.includes(asType)) {
                const typeStart = match.index + match[0].length - match[1].length;
                const typeEnd = typeStart + match[1].length;
                diagnostics.push(createDiagnostic(lineIndex, typeStart, lineIndex, typeEnd,
                    `Invalid input type "${match[1]}" \u2014 expected one of: ${VALID_INPUT_TYPES.join(', ')}.`,
                    vscode.DiagnosticSeverity.Error));
            }
        }
    }

    return diagnostics;
}

export function checkDuplicateResults(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);

    const branchStack: number[] = [];
    const controlRegex = /\{%-?\s*(end)?(if|ifi|unless|case|else|elsif|elsifi|when)\b.*?-?%\}/g;
    const resultRegex = /\{%-?\s*result\s+["']([^"']+)["']/g;

    interface ResultEntry { line: number; start: number; end: number; branchPath: string; }
    const resultMap: Map<string, ResultEntry[]> = new Map();

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        if (isInCommentRange(lineIndex, commentRanges)) { continue; }
        const line = lines[lineIndex];

        // Collect all tags on this line with positions, process in order
        const events: { pos: number; type: 'control' | 'result'; isEnd?: boolean; tag?: string; name?: string; fullEnd?: number }[] = [];

        controlRegex.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = controlRegex.exec(line)) !== null) {
            events.push({ pos: m.index, type: 'control', isEnd: !!m[1], tag: m[2].toLowerCase(), fullEnd: m.index + m[0].length });
        }
        resultRegex.lastIndex = 0;
        while ((m = resultRegex.exec(line)) !== null) {
            const tagEnd = line.indexOf('%}', m.index);
            events.push({ pos: m.index, type: 'result', name: m[1], fullEnd: tagEnd !== -1 ? tagEnd + 2 : m.index + m[0].length });
        }
        events.sort((a, b) => a.pos - b.pos);

        for (const evt of events) {
            if (evt.type === 'control') {
                const tag = evt.tag!;
                if (evt.isEnd) {
                    if (['if', 'ifi', 'unless', 'case'].includes(tag) && branchStack.length > 0) {
                        branchStack.pop();
                    }
                } else if (['else', 'elsif', 'elsifi', 'when'].includes(tag)) {
                    if (branchStack.length > 0) { branchStack[branchStack.length - 1]++; }
                } else if (['if', 'ifi', 'unless', 'case'].includes(tag)) {
                    branchStack.push(0);
                }
            } else {
                const name = evt.name!;
                const path = branchStack.join(',');
                if (!resultMap.has(name)) { resultMap.set(name, []); }
                resultMap.get(name)!.push({ line: lineIndex, start: evt.pos, end: evt.fullEnd!, branchPath: path });
            }
        }
    }

    for (const [name, entries] of resultMap) {
        const byPath: Map<string, ResultEntry[]> = new Map();
        for (const entry of entries) {
            if (!byPath.has(entry.branchPath)) { byPath.set(entry.branchPath, []); }
            byPath.get(entry.branchPath)!.push(entry);
        }
        for (const [, pathEntries] of byPath) {
            if (pathEntries.length > 1) {
                for (let i = 1; i < pathEntries.length; i++) {
                    diagnostics.push(createDiagnostic(
                        pathEntries[i].line, pathEntries[i].start, pathEntries[i].line, pathEntries[i].end,
                        `Duplicate result "${name}" \u2014 overwrites the result defined on line ${pathEntries[0].line + 1}.`,
                        vscode.DiagnosticSeverity.Warning));
                }
            }
        }
    }

    return diagnostics;
}