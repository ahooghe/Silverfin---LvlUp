import * as vscode from 'vscode';
import { activateFormatter } from './formatter/index';
import { activateActivityBar } from './activityBar/index';
import { activateDiagnostics } from './diagnostics/index';
import { activateHoverProvider, activateCompletionProvider } from './intellisense';
import { activateEditorCommands } from './editorCommands';
import { SilverfinQuickFixProvider } from './diagnostics/quickFixes';
import { SilverfinFoldingRangeProvider } from './foldingProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Silverfin extension activating...');

    activateFormatter(context);
    activateDiagnostics(context);
    activateActivityBar(context);
    activateHoverProvider(context);
    activateCompletionProvider(context);
    activateEditorCommands(context);

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { language: 'silverfin-lvlup' },
            new SilverfinQuickFixProvider(),
            { providedCodeActionKinds: SilverfinQuickFixProvider.providedCodeActionKinds }
        )
    );

    context.subscriptions.push(
        vscode.languages.registerFoldingRangeProvider(
            { language: 'silverfin-lvlup' },
            new SilverfinFoldingRangeProvider()
        )
    );

    // Semantic tokens provider (placeholder for future syntax highlighting)
    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: 'silverfin-lvlup' },
            new SilverfinSemanticTokensProvider(),
            new vscode.SemanticTokensLegend(['type'], ['declaration'])
        )
    );

    console.log('Silverfin: Level-Up extension is now active!');
}

class SilverfinSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.ProviderResult<vscode.SemanticTokens> {
        const builder = new vscode.SemanticTokensBuilder(new vscode.SemanticTokensLegend(['type'], ['declaration']));
        return builder.build();
    }
}

export function deactivate() { }