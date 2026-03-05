import * as vscode from 'vscode';
import { activateFormatter } from './formatter/index';
import { activateActivityBar } from './activityBar/index';
import { activateDiagnostics } from './diagnostics/index';
import { activateHoverProvider, activateCompletionProvider } from './intellisense';
import { activateEditorCommands } from './editorCommands';
import { SilverfinQuickFixProvider } from './diagnostics/quickFixes';
import { SilverfinFoldingRangeProvider } from './foldingProvider';
import { SilverfinDefinitionProvider } from './definitionProvider';
import { SilverfinDocumentSymbolProvider } from './symbolProvider';
import { SilverfinReferenceProvider } from './referenceProvider';
import { SilverfinRenameProvider } from './renameProvider';

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
        vscode.languages.registerDefinitionProvider(
            { language: 'silverfin-lvlup' },
            new SilverfinDefinitionProvider()
        )
    );

    context.subscriptions.push(
        vscode.languages.registerFoldingRangeProvider(
            { language: 'silverfin-lvlup' },
            new SilverfinFoldingRangeProvider()
        )
    );

    context.subscriptions.push(
        vscode.languages.registerReferenceProvider(
            { language: 'silverfin-lvlup' },
            new SilverfinReferenceProvider()
        )
    );

    context.subscriptions.push(
        vscode.languages.registerRenameProvider(
            { language: 'silverfin-lvlup' },
            new SilverfinRenameProvider()
        )
    );

    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            { language: 'silverfin-lvlup' },
            new SilverfinDocumentSymbolProvider()
        )
    );

    console.log('Silverfin: Level-Up extension is now active!');
}

export function deactivate() { }