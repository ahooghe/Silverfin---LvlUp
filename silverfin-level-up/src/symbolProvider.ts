import * as vscode from 'vscode';

interface SymbolRule {
    pattern: RegExp;
    nameGroup: number;
    kind: vscode.SymbolKind;
    detail?: string;
}

const SYMBOL_RULES: SymbolRule[] = [
    { pattern: /\{%-?\s*assign\s+(\w+)/g, nameGroup: 1, kind: vscode.SymbolKind.Variable, detail: 'assign' },
    { pattern: /\{%-?\s*capture\s+(\w+)/g, nameGroup: 1, kind: vscode.SymbolKind.Variable, detail: 'capture' },
    { pattern: /\{%-?\s*result\s+["']([^"']+)["']/g, nameGroup: 1, kind: vscode.SymbolKind.Constant, detail: 'result' },
    { pattern: /\{%-?\s*rollforward\s+["']([^"']+)["']/g, nameGroup: 1, kind: vscode.SymbolKind.Constant, detail: 'rollforward' },
    { pattern: /\{%-?\s*input\s+["']?([^\s"'%|]+)/g, nameGroup: 1, kind: vscode.SymbolKind.Field, detail: 'input' },
    { pattern: /\{%-?\s*include\s+["']([^"']+)["']/g, nameGroup: 1, kind: vscode.SymbolKind.Module, detail: 'include' },
    { pattern: /\{%-?\s*for\s+(\w+)\s+in\b/g, nameGroup: 1, kind: vscode.SymbolKind.Object, detail: 'for' },
    { pattern: /\{%-?\s*fori\s+(\w+)\s+in\b/g, nameGroup: 1, kind: vscode.SymbolKind.Object, detail: 'fori' },
    { pattern: /\{%-?\s*ic\b/g, nameGroup: 0, kind: vscode.SymbolKind.Namespace, detail: 'ic' },
    { pattern: /\{%-?\s*nic\b/g, nameGroup: 0, kind: vscode.SymbolKind.Namespace, detail: 'nic' },
    { pattern: /\{::infotext\b/g, nameGroup: 0, kind: vscode.SymbolKind.Event, detail: 'infotext' },
    { pattern: /\{::warningtext\b/g, nameGroup: 0, kind: vscode.SymbolKind.Event, detail: 'warningtext' },
    { pattern: /\{::cautiontext\b/g, nameGroup: 0, kind: vscode.SymbolKind.Event, detail: 'cautiontext' },
    { pattern: /\{::group\b/g, nameGroup: 0, kind: vscode.SymbolKind.Event, detail: 'group' },
];

export class SilverfinDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
        const symbols: vscode.DocumentSymbol[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const rule of SYMBOL_RULES) {
                rule.pattern.lastIndex = 0;
                let match;
                while ((match = rule.pattern.exec(line)) !== null) {
                    const name = rule.nameGroup === 0
                        ? rule.detail || match[0]
                        : match[rule.nameGroup];
                    const range = new vscode.Range(i, match.index, i, match.index + match[0].length);
                    const symbol = new vscode.DocumentSymbol(
                        name, rule.detail || '',
                        rule.kind, range, range
                    );
                    symbols.push(symbol);
                }
            }
        }

        return symbols;
    }
}