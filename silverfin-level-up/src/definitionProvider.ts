import * as vscode from 'vscode';
import * as path from 'path';

const DEFINITION_PATTERNS = [
    /\{%-?\s*assign\s+(\w+)/g,
    /\{%-?\s*capture\s+(\w+)/g,
    /\{%-?\s*for\s+(\w+)\s+in\b/g,
    /\{%-?\s*fori\s+(\w+)\s+in\b/g,
];

const INCLUDE_PATTERN = /\{%-?\s*include\s+["']shared\/([^"']+)["']/g;

interface DefinitionEntry {
    name: string;
    uri: vscode.Uri;
    range: vscode.Range;
}

function findDefinitionsInText(text: string, uri: vscode.Uri): DefinitionEntry[] {
    const entries: DefinitionEntry[] = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        for (const pattern of DEFINITION_PATTERNS) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(lines[i])) !== null) {
                const varName = match[1];
                const varStart = match[0].indexOf(varName);
                const col = match.index + varStart;
                entries.push({
                    name: varName,
                    uri,
                    range: new vscode.Range(i, col, i, col + varName.length)
                });
            }
        }
    }
    return entries;
}

function findTemplateRoot(filePath: string): string | null {
    let dir = path.dirname(filePath);
    // If inside text_parts, go up one level
    if (path.basename(dir) === 'text_parts') {
        dir = path.dirname(dir);
    }
    // Verify this looks like a template root (has main.liquid or config.json)
    return dir;
}

function extractIncludedSharedParts(text: string): string[] {
    const handles: string[] = [];
    let match;
    INCLUDE_PATTERN.lastIndex = 0;
    while ((match = INCLUDE_PATTERN.exec(text)) !== null) {
        if (!handles.includes(match[1])) {
            handles.push(match[1]);
        }
    }
    return handles;
}

function getWordAtPosition(document: vscode.TextDocument, position: vscode.Position): string | null {
    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z_]\w*/);
    return wordRange ? document.getText(wordRange) : null;
}

interface OrderedDefinition {
    entry: DefinitionEntry;
    fileOrder: number;
}

function getFileOrder(filePath: string, templateRoot: string): number {
    const rel = path.relative(templateRoot, filePath).replace(/\\/g, '/');
    // main.liquid runs first
    if (rel === 'main.liquid') { return 0; }
    // text_parts run after main, sorted alphabetically
    if (rel.startsWith('text_parts/')) { return 1; }
    // shared parts run when included (treat as before main for ordering purposes)
    return -1;
}

function getIncludeTarget(document: vscode.TextDocument, position: vscode.Position): { type: 'shared' | 'part'; handle: string } | null {
    const line = document.lineAt(position.line).text;
    const sharedMatch = line.match(/\{%-?\s*include\s+["']shared\/([^"']+)["']/);
    if (sharedMatch) {
        const handleStart = line.indexOf(sharedMatch[1]);
        const handleEnd = handleStart + sharedMatch[1].length;
        if (position.character >= handleStart && position.character <= handleEnd) {
            return { type: 'shared', handle: sharedMatch[1] };
        }
    }
    const partMatch = line.match(/\{%-?\s*include\s+["']part\/([^"']+)["']/);
    if (partMatch) {
        const handleStart = line.indexOf(partMatch[1]);
        const handleEnd = handleStart + partMatch[1].length;
        if (position.character >= handleStart && position.character <= handleEnd) {
            return { type: 'part', handle: partMatch[1] };
        }
    }
    return null;
}

export class SilverfinDefinitionProvider implements vscode.DefinitionProvider {
    async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): Promise<vscode.Location[] | null> {
        // Check if cursor is on an include path
        const includeTarget = getIncludeTarget(document, position);
        if (includeTarget) {
            return this.resolveInclude(document, includeTarget);
        }

        const word = getWordAtPosition(document, position);
        if (!word) { return null; }

        const allDefs: OrderedDefinition[] = [];
        const searchedUris = new Set<string>();
        const templateRoot = findTemplateRoot(document.uri.fsPath);
        const root = templateRoot || path.dirname(document.uri.fsPath);

        // 1. Collect definitions from template files (main + text_parts)
        const templateFiles = await vscode.workspace.findFiles(
            new vscode.RelativePattern(root, '**/*.liquid'),
            undefined, 50
        );
        // Sort: main.liquid first, then text_parts alphabetically
        templateFiles.sort((a, b) => {
            const oa = getFileOrder(a.fsPath, root);
            const ob = getFileOrder(b.fsPath, root);
            if (oa !== ob) { return oa - ob; }
            return a.fsPath.localeCompare(b.fsPath);
        });

        for (const uri of templateFiles) {
            const fileOrder = getFileOrder(uri.fsPath, root);
            await this.collectDefs(uri, word, fileOrder, allDefs, searchedUris);
        }

        // 2. Collect definitions from included shared parts
        const allSharedHandles: string[] = [];
        for (const uri of templateFiles) {
            try {
                const doc = await vscode.workspace.openTextDocument(uri);
                allSharedHandles.push(...extractIncludedSharedParts(doc.getText()));
            } catch { /* skip */ }
        }
        for (const handle of [...new Set(allSharedHandles)]) {
            const sharedFiles = await vscode.workspace.findFiles(
                `**/shared_parts/${handle}/**/*.liquid`, undefined, 20
            );
            sharedFiles.sort((a, b) => a.fsPath.localeCompare(b.fsPath));
            for (const uri of sharedFiles) {
                await this.collectDefs(uri, word, -1, allDefs, searchedUris);
            }
        }

        if (allDefs.length === 0) { return null; }

        // 3. Filter: same file = only before cursor; other template files = all shown
        const curLine = position.line;
        const curUri = document.uri.toString();

        const relevant = allDefs.filter(def => {
            if (def.entry.uri.toString() === curUri) {
                return def.entry.range.start.line < curLine;
            }
            return true;
        });

        if (relevant.length === 0) { return null; }

        // Sort: same file closest first, then other template files, then shared parts
        relevant.sort((a, b) => {
            const aIsSame = a.entry.uri.toString() === curUri;
            const bIsSame = b.entry.uri.toString() === curUri;
            // Same file definitions first, closest line on top
            if (aIsSame && bIsSame) {
                return b.entry.range.start.line - a.entry.range.start.line;
            }
            if (aIsSame) { return -1; }
            if (bIsSame) { return 1; }
            // Template files before shared parts
            if (a.fileOrder !== b.fileOrder) { return b.fileOrder - a.fileOrder; }
            const uriCmp = a.entry.uri.fsPath.localeCompare(b.entry.uri.fsPath);
            if (uriCmp !== 0) { return uriCmp; }
            return b.entry.range.start.line - a.entry.range.start.line;
        });

        return relevant.map(d => new vscode.Location(d.entry.uri, d.entry.range));
    }

    private async collectDefs(
        uri: vscode.Uri, word: string, fileOrder: number,
        allDefs: OrderedDefinition[], searched: Set<string>
    ): Promise<void> {
        const key = uri.toString();
        if (searched.has(key)) { return; }
        searched.add(key);
        try {
            const doc = await vscode.workspace.openTextDocument(uri);
            for (const entry of findDefinitionsInText(doc.getText(), uri)) {
                if (entry.name === word) {
                    allDefs.push({ entry, fileOrder });
                }
            }
        } catch { /* skip */ }
    }

    private async resolveInclude(
        document: vscode.TextDocument,
        target: { type: 'shared' | 'part'; handle: string }
    ): Promise<vscode.Location[] | null> {
        if (target.type === 'part') {
            const templateRoot = findTemplateRoot(document.uri.fsPath);
            if (!templateRoot) { return null; }
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(templateRoot, `text_parts/${target.handle}.liquid`),
                undefined, 1
            );
            if (files.length > 0) {
                return [new vscode.Location(files[0], new vscode.Range(0, 0, 0, 0))];
            }
        }

        if (target.type === 'shared') {
            const files = await vscode.workspace.findFiles(
                `**/shared_parts/${target.handle}/**/*.liquid`, undefined, 10
            );
            if (files.length > 0) {
                // Prefer main.liquid
                const main = files.find(f => f.fsPath.endsWith('main.liquid'));
                const primary = main || files[0];
                return [new vscode.Location(primary, new vscode.Range(0, 0, 0, 0))];
            }
        }

        return null;
    }
}