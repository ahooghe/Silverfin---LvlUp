import * as vscode from 'vscode';
import { silverfinDictionary } from './dictionary';
import { silverfinDbModel } from './silverfinDbModel';
import { activateFormatter } from './formatter';

export function activate(context: vscode.ExtensionContext) {
    activateFormatter(context);

    const disposableTokens = vscode.languages.registerDocumentSemanticTokensProvider(
        { language: 'silverfin-lvlup' },
        new SilverfinSemanticTokensProvider(),
        legend
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('silverfinFormatter.formatDocument', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'silverfin-lvlup') {
                await vscode.commands.executeCommand('editor.action.formatDocument');
            }
        })
    );
    const disposableHover = vscode.languages.registerHoverProvider('silverfin-lvlup', {
        provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
            const lineText = document.lineAt(position.line).text;

            const range = document.getWordRangeAtPosition(position, /[\w:.?]+/);
            const word = range ? document.getText(range) : '';

            let entry = silverfinDictionary[word];

            if (!entry && word.includes(':')) {
                const [baseWord] = word.split(':');
                entry = silverfinDictionary[baseWord];
            }

            if (typeof entry === 'string') {
                return new vscode.Hover(entry);
            } else if (entry && typeof entry === 'object' && 'description' in entry) {
                let hoverText = entry.description;

                if (entry.example) {
                    hoverText += `\n\n**Example:**\n\n${entry.example.replace(/\n/g, '\n\n').replace(/`/g, '\\`')}`;
                }

                if (entry.attributes) {
                    hoverText += `\n\n**Attributes:**`;
                    for (const [attr, attrDesc] of Object.entries(entry.attributes)) {
                        if (typeof attrDesc === 'string') {
                            hoverText += `\n- **${attr}**: ${attrDesc.replace(/\n/g, '\n\n')}`;
                        } else if (typeof attrDesc === 'object' && attrDesc.description) {
                            hoverText += `\n- **${attr}**: ${attrDesc.description.replace(/\n/g, '\n\n')}`;
                            if (attrDesc.options) {
                                hoverText += `\n  - **Options for ${attr}:**`;
                                for (const [option, optionDesc] of Object.entries(attrDesc.options)) {
                                    hoverText += `\n    - **${option}**: ${optionDesc}`;
                                }
                            }
                        }
                    }
                }

                return new vscode.Hover(hoverText);
            }

            if (word.includes('.')) {
                const path = word.split('.');
                let node: any = silverfinDbModel;
                for (const key of path) {
                    if (node && typeof node === 'object' && key in node) {
                        node = node[key];
                    } else if (node && typeof node === 'object') {
                        const dynamicKey = Object.keys(node).find(k => k.startsWith('{') && k.endsWith('}'));
                        if (dynamicKey) {
                            node = node[dynamicKey];
                        } else {
                            node = undefined;
                            break;
                        }
                    } else {
                        node = undefined;
                        break;
                    }
                }
                if (node && typeof node === 'object' && (node.description || node.type)) {
                    let hoverText = '';
                    if (node.type) hoverText += `**Type:** ${node.type}\n\n`;
                    if (node.description) hoverText += node.description;
                    return new vscode.Hover(new vscode.MarkdownString(hoverText));
                }
            }
            return null;
        }
    });

    context.subscriptions.push(disposableHover);

    const disposableCompletion = vscode.languages.registerCompletionItemProvider(
        'silverfin-lvlup',
        {
            provideCompletionItems(document, position) {
                const line = document.lineAt(position).text;
                const textBefore = line.substring(0, position.character);
                const match = textBefore.match(/([\w]+(?:\.[\w]+)*)\.$/);
                if (!match) {
                    return undefined;
                }
                const path = match[1].split('.');
                let node: any = silverfinDbModel;
                for (const key of path) {
                    if (node && typeof node === 'object' && key in node) {
                        node = node[key];
                    } else if (node && typeof node === 'object') {
                        const dynamicKey = Object.keys(node).find(k => k.startsWith('{') && k.endsWith('}'));
                        if (dynamicKey) {
                            node = node[dynamicKey];
                        } else {
                            return undefined;
                        }
                    } else {
                        return undefined;
                    }
                }
                if (node && typeof node === 'object') {
                    return Object.keys(node).map(k => {
                        const value = node[k];
                        const item = new vscode.CompletionItem(k, vscode.CompletionItemKind.Property);
                        if (value && typeof value === 'object') {
                            if (value.type) item.detail = value.type;
                            if (value.description) item.documentation = value.description;
                        }
                        return item;
                    });
                }
                return undefined;
            }
        },
        '.'
    );
    context.subscriptions.push(disposableCompletion);

    vscode.workspace.getConfiguration('workbench').update('colorTheme', 'Silverfin Theme', vscode.ConfigurationTarget.Global);

    console.log('Silverfin: Level-Up extension is now active!');
}

class SilverfinSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.ProviderResult<vscode.SemanticTokens> {
        const builder = new vscode.SemanticTokensBuilder(legend);

        for (let line = 0; line < document.lineCount; line++) {
            const text = document.lineAt(line).text;

            const index = text.indexOf('assign');
            if (index !== -1) {
                builder.push(new vscode.Range(new vscode.Position(line, index), new vscode.Position(line, index + 6)), 'type');
            }
        }

        return builder.build();
    }
}

const legend = new vscode.SemanticTokensLegend(['type'], ['declaration']);

export function deactivate() { }