import * as vscode from 'vscode';
import { silverfinDictionary } from './dictionary';

export function activate(context: vscode.ExtensionContext) {
    const disposableTokens = vscode.languages.registerDocumentSemanticTokensProvider(
        { language: 'liquid' },
        new SilverfinSemanticTokensProvider(),
        legend
    );

    context.subscriptions.push(disposableTokens);

    const disposableHover = vscode.languages.registerHoverProvider('liquid', {
        provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
            const lineText = document.lineAt(position.line).text;
        
            const range = document.getWordRangeAtPosition(position, /[\w:]+/);
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
                    hoverText += `\n\n**Example:**\n\`${entry.example}\``;
                }
        
                if (entry.attributes) {
                    hoverText += `\n\n**Attributes:**`;
                    for (const [attr, attrDesc] of Object.entries(entry.attributes)) {
                        if (typeof attrDesc === 'string') {
                            hoverText += `\n- **${attr}**: ${attrDesc}`;
                        } else if (typeof attrDesc === 'object' && attrDesc.description) {
                            hoverText += `\n- **${attr}**: ${attrDesc.description}`;
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
        
            return null;
        }
    });

    context.subscriptions.push(disposableHover);

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

export function deactivate() {}