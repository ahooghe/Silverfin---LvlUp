import * as vscode from 'vscode';
import { defaultConfig } from './config';
import { cleanHtml, cleanLiquid, cleanMarkdown, setIndent } from './helpers';
import { handleStripnewlines, handleCaptureBlock, handleLinktoBlock, handleIcBlock, handleIncompleteTag } from './handlers';
import { processCleanedLine } from './processors';

export function activateFormatter(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('silverfin-lvlup', {
            provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                const config = { ...defaultConfig };
                const editorConfig = vscode.workspace.getConfiguration('editor', document.uri);
                config.tabSize = editorConfig.get('tabSize') as number;
                config.padWithTabs = !editorConfig.get('insertSpaces') as boolean;

                const formatted = formatSilverfin(document.getText(), config);
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(document.getText().length)
                );
                return [vscode.TextEdit.replace(fullRange, formatted)];
            }
        })
    );
}

function formatSilverfin(text: string, config: typeof defaultConfig): string {
    const rawLines = text.replace(/\r\n/g, '\n').split('\n');
    const output: string[] = [];
    let indentLevel = 0;

    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        let completeTag: string | undefined;
        let cleanedLine: string | undefined;

        if (line.length === 0) {
            output.push('');
            continue;
        }
        else if (line.search(/({%|{{|{:|<)/) === -1) {
            output.push(setIndent(line, indentLevel, config));
            continue;
        }
        else {
            const stripnewlinesResult = handleStripnewlines(rawLines, i);
            if (stripnewlinesResult.handled) {
                if (stripnewlinesResult.isMarkdownTable) {
                    output.push(stripnewlinesResult.content);
                    i = stripnewlinesResult.nextIndex;
                    continue;
                } else {
                    i = stripnewlinesResult.nextIndex;
                }
            } else {
                const linktoResult = handleLinktoBlock(rawLines, i);
                if (linktoResult.handled) {
                    completeTag = linktoResult.content;
                    i = linktoResult.nextIndex;
                } else {
                    const captureResult = handleCaptureBlock(rawLines, i, indentLevel, config);
                    if (captureResult.handled) {
                        output.push(captureResult.content);
                        i = captureResult.nextIndex;
                        continue;
                    } else {
                        const icResult = handleIcBlock(rawLines, i);
                        if (icResult.handled) {
                            completeTag = icResult.content;
                            i = icResult.nextIndex;
                        } else {
                            const incompleteResult = handleIncompleteTag(rawLines, i);
                            if (incompleteResult.handled) {
                                completeTag = incompleteResult.content;
                                i = incompleteResult.nextIndex;
                            }
                        }
                    }
                }
            }
        }

        if (completeTag !== undefined) {
            cleanedLine = cleanMarkdown(cleanLiquid(cleanHtml(completeTag))).trim();
        } else {
            cleanedLine = cleanMarkdown(cleanLiquid(cleanHtml(line))).trim();
        }

        const processResult = processCleanedLine(cleanedLine, indentLevel, config, output, rawLines, i);
        indentLevel = processResult.indentLevel;
    }
    return output.join('\n');
}