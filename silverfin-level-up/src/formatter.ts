import * as vscode from 'vscode';

// Configurable formatter behavior
interface FormatterConfig {
    logicBlocks: string[];
    logicSubBlocks: string[];
    liquidBlocks: string[];
    singleLineLogicTags: string[];
    htmlSingleTags: string[];
    htmlBlockTags: string[];
    htmlInlineTags: string[];
    htmlFlexTags: string[];
    markdownFlushTags: string[];
    markdownClosingTags: string[];
    markdownStyleTags: string[];
    padWithTabs: boolean;
    tabSize: number;
    addBlankLineAfterLogicBlock: boolean;
    enforceBlockFormatting: boolean;
    preserveMarkdownTables: boolean;
}

const defaultConfig: FormatterConfig = {
    logicBlocks: ['if', 'for', 'fori', 'ifi', 'unless', 'case', 'stripnewlines'],
    logicSubBlocks: ['else', 'elsif', 'elsifi', 'when'],
    liquidBlocks: ['capture', 'locale', 'linkto', 'radiogroup', 'currencyconfiguration', 'adjustmentbutton', 'ic'],
    singleLineLogicTags: ['assign', 'input', 'result', 'push', 'pop', 'newpage', 'include', 'changeorientation', 't', 'unreconciled'],
    htmlSingleTags: ['br', 'hr'],
    htmlBlockTags: ['table', 'thead', 'tbody', 'tr'],
    htmlInlineTags: ['b', 'i', 'em', 'u', 'sub', 'sup', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'],
    htmlFlexTags: ['td', 'th', 'p'],
    markdownFlushTags: ['infotext', 'warningtext'],
    markdownClosingTags: ['infotext', 'warningtext'],
    markdownStyleTags: ['target', 'font', 'indent'],
    padWithTabs: true,
    tabSize: 4,
    addBlankLineAfterLogicBlock: true,
    enforceBlockFormatting: false,
    preserveMarkdownTables: true,
};

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

function formatSilverfin(text: string, config: FormatterConfig): string {
    const rawLines = text.replace(/\r\n/g, '\n').split('\n');
    const output: string[] = [];
    let indentLevel = 0;
    let inStripNewlines = false;
    let inMarkdownTable = false;
    let inCapture = false;
    

    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i].trim();

        if (line.length === 0) {
            output.push('');
            continue;
        }

    }
    return output.join('\n');
}
