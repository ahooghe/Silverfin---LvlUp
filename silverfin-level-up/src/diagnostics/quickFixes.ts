import * as vscode from 'vscode';
import { KNOWN_TAGS } from './helpers';

const VALID_INPUT_TYPES = [
    'currency', 'integer', 'percentage', 'text', 'text_area', 'textarea',
    'select', 'boolean', 'date', 'file', 'period', 'accounting'
];

function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) { dp[i][0] = i; }
    for (let j = 0; j <= n; j++) { dp[0][j] = j; }
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

interface MatchResult {
    match: string;
    distance: number;
    isUnambiguous: boolean;
}

function findClosestMatch(input: string, candidates: string[], maxDistance = 3): MatchResult | null {
    let best: string | null = null;
    let bestDist = maxDistance + 1;
    let countAtBest = 0;
    for (const candidate of candidates) {
        const dist = levenshtein(input.toLowerCase(), candidate.toLowerCase());
        if (dist > 0 && dist < bestDist) {
            bestDist = dist;
            best = candidate;
            countAtBest = 1;
        } else if (dist === bestDist) {
            countAtBest++;
        }
    }
    if (!best) { return null; }
    return { match: best, distance: bestDist, isUnambiguous: countAtBest === 1 };
}

export class SilverfinQuickFixProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.SourceFixAll
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        _range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext
    ): vscode.CodeAction[] {
        const fixAll = context.only?.contains(vscode.CodeActionKind.SourceFixAll) ?? false;
        const actions: vscode.CodeAction[] = [];

        const diagnostics = fixAll
            ? vscode.languages.getDiagnostics(document.uri).filter(d => d.source === 'Silverfin')
            : context.diagnostics.filter(d => d.source === 'Silverfin');

        for (const diagnostic of diagnostics) {
            const msg = diagnostic.message;

            if (msg.startsWith('Unknown Liquid tag')) {
                const kwMatch = msg.match(/Unknown Liquid tag "\{% (\w+) %\}"/);
                if (kwMatch) {
                    const typo = kwMatch[1];
                    const result = findClosestMatch(typo, KNOWN_TAGS);
                    if (result) {
                        const highConfidence = result.distance <= 1 && result.isUnambiguous;
                        if (!fixAll || highConfidence) {
                            actions.push(this.createReplaceAction(
                                document, diagnostic, typo, result.match,
                                `Change "${typo}" to "${result.match}"`,
                                highConfidence, fixAll
                            ));
                        }
                    }
                }
            }

            if (msg.startsWith('Invalid input type')) {
                const typeMatch = msg.match(/Invalid input type "(\w+)"/);
                if (typeMatch) {
                    const typo = typeMatch[1];
                    const result = findClosestMatch(typo, VALID_INPUT_TYPES);
                    if (result) {
                        const highConfidence = result.distance <= 1 && result.isUnambiguous;
                        if (!fixAll || highConfidence) {
                            actions.push(this.createReplaceAction(
                                document, diagnostic, typo, result.match,
                                `Change "${typo}" to "${result.match}"`,
                                highConfidence, fixAll
                            ));
                        }
                    }
                }
            }
        }

        return actions;
    }

    private createReplaceAction(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic,
        oldText: string,
        newText: string,
        title: string,
        isPreferred: boolean,
        fixAll = false
    ): vscode.CodeAction {
        const kind = fixAll ? vscode.CodeActionKind.SourceFixAll : vscode.CodeActionKind.QuickFix;
        const action = new vscode.CodeAction(title, kind);
        action.diagnostics = [diagnostic];
        action.isPreferred = isPreferred;

        const edit = new vscode.WorkspaceEdit();
        const diagText = document.getText(diagnostic.range);
        const idx = diagText.indexOf(oldText);
        if (idx !== -1) {
            const replaceRange = new vscode.Range(
                diagnostic.range.start.translate(0, idx),
                diagnostic.range.start.translate(0, idx + oldText.length)
            );
            edit.replace(document.uri, replaceRange, newText);
        } else {
            edit.replace(document.uri, diagnostic.range, newText);
        }

        action.edit = edit;
        return action;
    }
}