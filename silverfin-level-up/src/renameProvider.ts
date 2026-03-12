import * as vscode from 'vscode';
import { findTemplateRoot, isInSharedPart, findSharedPartRoot, extractIncludedSharedParts } from './workspaceUtils';

export class SilverfinRenameProvider implements vscode.RenameProvider {
    async prepareRename(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<vscode.Range | { range: vscode.Range; placeholder: string }> {
        const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z_]\w*/);
        if (!wordRange) {
            throw new Error('Cannot rename this element.');
        }
        return wordRange;
    }

    async provideRenameEdits(
        document: vscode.TextDocument,
        position: vscode.Position,
        newName: string,
        _token: vscode.CancellationToken
    ): Promise<vscode.WorkspaceEdit | null> {
        const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z_]\w*/);
        if (!wordRange) { return null; }
        const oldName = document.getText(wordRange);

        const edit = new vscode.WorkspaceEdit();
        const searched = new Set<string>();
        const root = findTemplateRoot(document.uri.fsPath);

        // Determine if we're in a shared part -- only rename within that shared part
        if (isInSharedPart(document.uri.fsPath)) {
            const sharedRoot = findSharedPartRoot(document.uri.fsPath);
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(sharedRoot, '**/*.liquid'), undefined, 20
            );
            for (const uri of files) {
                await this.replaceInFile(uri, oldName, newName, edit, searched);
            }
            return edit;
        }

        // Template scope: main + text_parts
        const templateFiles = await vscode.workspace.findFiles(
            new vscode.RelativePattern(root, '**/*.liquid'), undefined, 50
        );

        const allSharedHandles: string[] = [];
        for (const uri of templateFiles) {
            await this.replaceInFile(uri, oldName, newName, edit, searched);
            try {
                const doc = await vscode.workspace.openTextDocument(uri);
                allSharedHandles.push(...extractIncludedSharedParts(doc.getText()));
            } catch { /* skip */ }
        }

        // Also rename in included shared parts
        for (const handle of [...new Set(allSharedHandles)]) {
            const sharedFiles = await vscode.workspace.findFiles(
                `**/shared_parts/${handle}/**/*.liquid`, undefined, 20
            );
            for (const uri of sharedFiles) {
                await this.replaceInFile(uri, oldName, newName, edit, searched);
            }
        }

        return edit;
    }

    private async replaceInFile(
        uri: vscode.Uri, oldName: string, newName: string,
        edit: vscode.WorkspaceEdit, searched: Set<string>
    ): Promise<void> {
        const key = uri.toString();
        if (searched.has(key)) { return; }
        searched.add(key);
        try {
            const doc = await vscode.workspace.openTextDocument(uri);
            const text = doc.getText();
            const lines = text.split('\n');
            const regex = new RegExp(`\\b${oldName}\\b`, 'g');

            for (let i = 0; i < lines.length; i++) {
                let match;
                regex.lastIndex = 0;
                while ((match = regex.exec(lines[i])) !== null) {
                    edit.replace(uri,
                        new vscode.Range(i, match.index, i, match.index + oldName.length),
                        newName
                    );
                }
            }
        } catch { /* skip */ }
    }
}