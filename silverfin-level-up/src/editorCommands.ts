import * as vscode from 'vscode';

export function activateEditorCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('silverfinFormatter.formatDocument', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'silverfin-lvlup') {
                await vscode.commands.executeCommand('editor.action.formatDocument');
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('silverfin-lvlup.surroundWithQuotes', async (args) => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;
            const selections = editor.selections;
            const quote = args && args.quote ? args.quote : '"';
            await editor.edit(editBuilder => {
                for (const sel of selections) {
                    const text = editor.document.getText(sel);
                    editBuilder.replace(sel, quote + text + quote);
                }
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('silverfin-lvlup.surroundWithComment', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;
            const selections = editor.selections;
            await editor.edit(editBuilder => {
                for (const sel of selections) {
                    const text = editor.document.getText(sel);
                    editBuilder.replace(sel, `{% comment %}\n${text}\n{% endcomment %}`);
                }
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('silverfin-lvlup.smartSpace', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'silverfin-lvlup') {
                await vscode.commands.executeCommand('type', { text: ' ' });
                return;
            }
            const pos = editor.selection.active;
            const line = editor.document.lineAt(pos.line).text;
            if (
                line.substring(pos.character - 2, pos.character) === '{%' &&
                line.substring(pos.character, pos.character + 2) === '%}'
            ) {
                await editor.edit(editBuilder => { editBuilder.insert(pos, '  '); });
                const newPos = pos.translate(0, 1);
                editor.selection = new vscode.Selection(newPos, newPos);
            } else if (
                line.substring(pos.character - 2, pos.character) === '{{' &&
                line.substring(pos.character, pos.character + 2) === '}}'
            ) {
                await editor.edit(editBuilder => { editBuilder.insert(pos, '  '); });
                const newPos = pos.translate(0, 1);
                editor.selection = new vscode.Selection(newPos, newPos);
            } else {
                await vscode.commands.executeCommand('type', { text: ' ' });
            }
        })
    );
}