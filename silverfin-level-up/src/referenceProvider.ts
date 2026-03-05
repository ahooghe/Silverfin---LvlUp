import * as vscode from 'vscode';
import * as path from 'path';

const INCLUDE_PATTERN = /\{%-?\s*include\s+["']shared\/([^"']+)["']/g;

function findTemplateRoot(filePath: string): string {
    let dir = path.dirname(filePath);
    if (path.basename(dir) === 'text_parts') {
        dir = path.dirname(dir);
    }
    return dir;
}

function findWordOccurrences(text: string, word: string, uri: vscode.Uri): vscode.Location[] {
    const locations: vscode.Location[] = [];
    const lines = text.split('\n');
    const wordRegex = new RegExp(`\\b${word}\\b`, 'g');

    for (let i = 0; i < lines.length; i++) {
        let match;
        wordRegex.lastIndex = 0;
        while ((match = wordRegex.exec(lines[i])) !== null) {
            locations.push(new vscode.Location(
                uri, new vscode.Range(i, match.index, i, match.index + word.length)
            ));
        }
    }
    return locations;
}

function extractIncludedSharedParts(text: string): string[] {
    const handles: string[] = [];
    let match;
    INCLUDE_PATTERN.lastIndex = 0;
    while ((match = INCLUDE_PATTERN.exec(text)) !== null) {
        if (!handles.includes(match[1])) { handles.push(match[1]); }
    }
    return handles;
}

export class SilverfinReferenceProvider implements vscode.ReferenceProvider {
    async provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        _context: vscode.ReferenceContext,
        _token: vscode.CancellationToken
    ): Promise<vscode.Location[] | null> {
        const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z_]\w*/);
        if (!wordRange) { return null; }
        const word = document.getText(wordRange);

        const locations: vscode.Location[] = [];
        const searched = new Set<string>();
        const root = findTemplateRoot(document.uri.fsPath);

        // Search all template files (main + text_parts)
        const templateFiles = await vscode.workspace.findFiles(
            new vscode.RelativePattern(root, '**/*.liquid'), undefined, 50
        );

        const allSharedHandles: string[] = [];
        for (const uri of templateFiles) {
            await this.searchFile(uri, word, locations, searched);
            try {
                const doc = await vscode.workspace.openTextDocument(uri);
                allSharedHandles.push(...extractIncludedSharedParts(doc.getText()));
            } catch { /* skip */ }
        }

        // Search included shared parts
        for (const handle of [...new Set(allSharedHandles)]) {
            const sharedFiles = await vscode.workspace.findFiles(
                `**/shared_parts/${handle}/**/*.liquid`, undefined, 20
            );
            for (const uri of sharedFiles) {
                await this.searchFile(uri, word, locations, searched);
            }
        }

        return locations.length > 0 ? locations : null;
    }

    private async searchFile(
        uri: vscode.Uri, word: string,
        locations: vscode.Location[], searched: Set<string>
    ): Promise<void> {
        const key = uri.toString();
        if (searched.has(key)) { return; }
        searched.add(key);
        try {
            const doc = await vscode.workspace.openTextDocument(uri);
            locations.push(...findWordOccurrences(doc.getText(), word, uri));
        } catch { /* skip */ }
    }
}