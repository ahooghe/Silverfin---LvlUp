import * as vscode from 'vscode';
import { checkLiquidBlockMatching, checkMarkdownBlockMatching, checkGroupTagPairing, checkHtmlBlockMatching, checkSubBlockOrdering, checkIcNicNesting } from './blockMatching';
import { checkUnclosedLiquidTags, checkOrphanClosingDelimiters, checkEmptyTags } from './tagSyntax';
import { checkEmptyBlockBodies } from './emptyBlocks';
import { checkTagCompleteness, checkInputAsType, checkDuplicateResults, checkTranslationTags, checkDanglingOperators, checkEmptyPipeFilter } from './tagCompleteness';
import { checkUnusedVariables } from './unusedVariables';

const LANGUAGE_ID = 'silverfin-lvlup';

export function activateDiagnostics(context: vscode.ExtensionContext): void {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('silverfin');
    context.subscriptions.push(diagnosticCollection);

    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const runDiagnostics = async (document: vscode.TextDocument) => {
        if (document.languageId !== LANGUAGE_ID) { return; }
        const diagnostics = await analyzeSilverfinDocument(document);
        diagnosticCollection.set(document.uri, diagnostics);
    };

    const debouncedRun = (document: vscode.TextDocument) => {
        if (debounceTimer) { clearTimeout(debounceTimer); }
        debounceTimer = setTimeout(() => runDiagnostics(document), 500);
    };

    if (vscode.window.activeTextEditor) {
        runDiagnostics(vscode.window.activeTextEditor.document);
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => { if (editor) { runDiagnostics(editor.document); } }),
        vscode.workspace.onDidChangeTextDocument(event => { debouncedRun(event.document); }),
        vscode.workspace.onDidCloseTextDocument(document => { diagnosticCollection.delete(document.uri); })
    );
}

async function analyzeSilverfinDocument(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];

    diagnostics.push(...checkLiquidBlockMatching(text));
    diagnostics.push(...checkMarkdownBlockMatching(text));
    diagnostics.push(...checkGroupTagPairing(text));
    diagnostics.push(...checkHtmlBlockMatching(text));
    diagnostics.push(...checkUnclosedLiquidTags(text));
    diagnostics.push(...checkOrphanClosingDelimiters(text));
    diagnostics.push(...checkEmptyTags(text));
    diagnostics.push(...checkEmptyBlockBodies(text));
    diagnostics.push(...checkTagCompleteness(text));
    diagnostics.push(...checkSubBlockOrdering(text));
    diagnostics.push(...checkIcNicNesting(text));
    diagnostics.push(...checkInputAsType(text));
    diagnostics.push(...checkDuplicateResults(text));
    diagnostics.push(...checkTranslationTags(text));
    diagnostics.push(...checkDanglingOperators(text));
    diagnostics.push(...checkEmptyPipeFilter(text));
    diagnostics.push(...await checkUnusedVariables(text, document.uri));

    return diagnostics;
}