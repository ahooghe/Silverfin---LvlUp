import * as vscode from 'vscode';
import * as path from 'path';
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

function getSharedPartHandle(filePath: string): string | null {
    const normalized = filePath.replace(/\\/g, '/');
    const match = normalized.match(/\/shared_parts\/([^/]+)\//);
    return match ? match[1] : null;
}

function isInSharedPart(filePath: string): boolean {
    return getSharedPartHandle(filePath) !== null;
}

async function getExternalTexts(uri: vscode.Uri): Promise<string[]> {
    const filePath = uri.fsPath;
    const handle = getSharedPartHandle(filePath);
    if (!handle) { return []; }

    // Find all templates that include this shared part
    const allFiles = await vscode.workspace.findFiles('**/*.liquid', '**/node_modules/**', 500);
    const includeRegex = new RegExp(`\\{%-?\\s*include\\s+["']shared/${handle}["']`);
    const texts: string[] = [];

    for (const file of allFiles) {
        if (file.fsPath.replace(/\\/g, '/').includes('/shared_parts/')) { continue; }
        try {
            const doc = await vscode.workspace.openTextDocument(file);
            const text = doc.getText();
            if (includeRegex.test(text)) {
                texts.push(text);
            }
        } catch { /* skip */ }
    }
    return texts;
}

function isUsedInFile(text: string, lines: string[], def: VarDefinition, commentRanges: ReturnType<typeof getCommentRanges>): { used: boolean; hasIncludeAfter: boolean } {
    const wordRegex = new RegExp(`\\b${def.name}\\b`);
    let used = false;
    let hasIncludeAfter = false;

    for (let i = def.line; i < lines.length; i++) {
        if (isInCommentRange(i, commentRanges)) { continue; }
        const searchLine = i === def.line
            ? lines[i].substring(def.end)
            : lines[i];

        if (i !== def.line) {
            const redefAssign = new RegExp(`\\{%-?\\s*assign\\s+${def.name}\\b`);
            const redefCapture = new RegExp(`\\{%-?\\s*capture\\s+${def.name}\\b`);
            if (redefAssign.test(lines[i]) || redefCapture.test(lines[i])) {
                const afterKeyword = lines[i].replace(redefAssign, '').replace(redefCapture, '');
                if (wordRegex.test(afterKeyword)) { return { used: true, hasIncludeAfter }; }
                continue;
            }
        }

        if (wordRegex.test(searchLine)) { return { used: true, hasIncludeAfter }; }
        if (INCLUDE_PATTERN.test(searchLine)) { hasIncludeAfter = true; }
    }

    return { used, hasIncludeAfter };
}

export async function checkUnusedVariables(text: string, uri: vscode.Uri): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = text.split('\n');
    const commentRanges = getCommentRanges(lines);
    const definitions: VarDefinition[] = [];

    for (let i = 0; i < lines.length; i++) {
        if (isInCommentRange(i, commentRanges)) { continue; }
        for (const pattern of [ASSIGN_PATTERN, CAPTURE_PATTERN]) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(lines[i])) !== null) {
                const name = match[1];
                const nameStart = match.index + match[0].indexOf(name);
                definitions.push({ name, line: i, start: nameStart, end: nameStart + name.length });
            }
        }
    }

    if (definitions.length === 0) { return diagnostics; }

    // For shared parts, fetch texts of templates that include this shared part
    const inSharedPart = isInSharedPart(uri.fsPath);
    let externalTexts: string[] = [];
    if (inSharedPart) {
        externalTexts = await getExternalTexts(uri);
    }

    for (const def of definitions) {
        const { used, hasIncludeAfter } = isUsedInFile(text, lines, def, commentRanges);

        if (used || hasIncludeAfter) { continue; }

        // For shared parts, check if the variable is used in any consuming template
        if (inSharedPart) {
            const wordRegex = new RegExp(`\\b${def.name}\\b`);
            const usedExternally = externalTexts.some(t => wordRegex.test(t));
            if (usedExternally) { continue; }
        }

        diagnostics.push(createDiagnostic(
            def.line, def.start, def.line, def.end,
            `Variable "${def.name}" is assigned but never used${inSharedPart ? ' in this shared part or any template that includes it' : ' in this file'}.`,
            vscode.DiagnosticSeverity.Warning
        ));
    }

    return diagnostics;
}