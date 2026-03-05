import * as vscode from 'vscode';
import { createDiagnostic, getCommentRanges, isInCommentRange } from './helpers';

interface VarDefinition {
    name: string;
    line: number;
    start: number;
    end: number;
}

const ASSIGN_PATTERN = /\{%-?\s*assign\s+(\w+)/g;
const CAPTURE_PATTERN = /\{%-?\s*capture\s+(\w+)/g;
const INCLUDE_PATTERN = /\{%-?\s*include\b/;

export function checkUnusedVariables(text: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);
    const definitions: VarDefinition[] = [];

    // Collect all assign/capture definitions
    for (let i = 0; i < lines.length; i++) {
        if (isInCommentRange(i, commentRanges)) { continue; }
        for (const pattern of [ASSIGN_PATTERN, CAPTURE_PATTERN]) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(lines[i])) !== null) {
                const name = match[1];
                const nameStart = match.index + match[0].indexOf(name);
                definitions.push({
                    name,
                    line: i,
                    start: nameStart,
                    end: nameStart + name.length
                });
            }
        }
    }

    for (const def of definitions) {
        // Check if the variable is referenced anywhere after its definition
        const wordRegex = new RegExp(`\\b${def.name}\\b`);
        let used = false;
        let hasIncludeAfter = false;

        for (let i = def.line; i < lines.length; i++) {
            if (isInCommentRange(i, commentRanges)) { continue; }
            const searchLine = i === def.line
                ? lines[i].substring(def.end)
                : lines[i];

            // Skip lines that are themselves assign/capture of the same var (redefinition, not usage)
            if (i !== def.line) {
                const redefAssign = new RegExp(`\\{%-?\\s*assign\\s+${def.name}\\b`);
                const redefCapture = new RegExp(`\\{%-?\\s*capture\\s+${def.name}\\b`);
                if (redefAssign.test(lines[i]) || redefCapture.test(lines[i])) {
                    // Check if the variable is also used on the right side of this redefinition
                    const afterKeyword = lines[i].replace(redefAssign, '').replace(redefCapture, '');
                    if (wordRegex.test(afterKeyword)) {
                        used = true;
                        break;
                    }
                    continue;
                }
            }

            if (wordRegex.test(searchLine)) {
                used = true;
                break;
            }

            if (INCLUDE_PATTERN.test(searchLine)) {
                hasIncludeAfter = true;
            }
        }

        if (!used && !hasIncludeAfter) {
            diagnostics.push(createDiagnostic(
                def.line, def.start, def.line, def.end,
                `Variable "${def.name}" is assigned but never used in this file.`,
                vscode.DiagnosticSeverity.Warning
            ));
        }
    }

    return diagnostics;
}