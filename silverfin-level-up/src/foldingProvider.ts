import * as vscode from 'vscode';

const LIQUID_BLOCK_PAIRS: Record<string, string> = {
    'if': 'endif', 'ifi': 'endifi', 'for': 'endfor', 'fori': 'endfori',
    'unless': 'endunless', 'case': 'endcase', 'capture': 'endcapture',
    'ic': 'endic', 'nic': 'endnic', 'comment': 'endcomment',
    'stripnewlines': 'endstripnewlines', 'locale': 'endlocale',
    'radiogroup': 'endradiogroup', 'currencyconfiguration': 'endcurrencyconfiguration',
    'adjustmentbutton': 'endadjustmentbutton', 'addnewinputs': 'endaddnewinputs',
    'linkto': 'endlinkto'
};

const MARKDOWN_BLOCK_TAGS = ['infotext', 'warningtext', 'cautiontext', 'font', 'indent', 'target', 'group'];
const HTML_BLOCK_TAGS = ['table', 'thead', 'tbody', 'tr', 'td', 'th', 'div', 'span', 'ul', 'ol', 'li'];

export class SilverfinFoldingRangeProvider implements vscode.FoldingRangeProvider {
    provideFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
        const ranges: vscode.FoldingRange[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        ranges.push(...this.foldLiquidBlocks(lines));
        ranges.push(...this.foldMarkdownBlocks(lines));
        ranges.push(...this.foldHtmlBlocks(lines));

        return ranges;
    }

    private foldLiquidBlocks(lines: string[]): vscode.FoldingRange[] {
        const ranges: vscode.FoldingRange[] = [];
        const closerToOpener: Record<string, string> = {};
        for (const [opener, closer] of Object.entries(LIQUID_BLOCK_PAIRS)) {
            closerToOpener[closer] = opener;
        }

        const stacks: Record<string, number[]> = {};
        const tagRegex = /\{%-?\s*(\w+)\b/g;

        for (let i = 0; i < lines.length; i++) {
            let match;
            tagRegex.lastIndex = 0;
            while ((match = tagRegex.exec(lines[i])) !== null) {
                const tag = match[1].toLowerCase();

                if (LIQUID_BLOCK_PAIRS[tag]) {
                    if (!stacks[tag]) { stacks[tag] = []; }
                    stacks[tag].push(i);
                } else if (closerToOpener[tag]) {
                    const opener = closerToOpener[tag];
                    if (stacks[opener] && stacks[opener].length > 0) {
                        const startLine = stacks[opener].pop()!;
                        if (i > startLine) {
                            const kind = tag === 'endcomment'
                                ? vscode.FoldingRangeKind.Comment
                                : vscode.FoldingRangeKind.Region;
                            ranges.push(new vscode.FoldingRange(startLine, i, kind));
                        }
                    }
                }
            }
        }
        return ranges;
    }

    private foldMarkdownBlocks(lines: string[]): vscode.FoldingRange[] {
        const ranges: vscode.FoldingRange[] = [];
        const stacks: Record<string, number[]> = {};

        for (let i = 0; i < lines.length; i++) {
            for (const tag of MARKDOWN_BLOCK_TAGS) {
                const openRegex = new RegExp(`\\{::${tag}\\b`);
                const closeRegex = new RegExp(`\\{:/${tag}\\}`);

                if (openRegex.test(lines[i])) {
                    if (!stacks[tag]) { stacks[tag] = []; }
                    stacks[tag].push(i);
                }
                if (closeRegex.test(lines[i])) {
                    if (stacks[tag] && stacks[tag].length > 0) {
                        const startLine = stacks[tag].pop()!;
                        if (i > startLine) {
                            ranges.push(new vscode.FoldingRange(startLine, i, vscode.FoldingRangeKind.Region));
                        }
                    }
                }
            }
        }
        return ranges;
    }

    private foldHtmlBlocks(lines: string[]): vscode.FoldingRange[] {
        const ranges: vscode.FoldingRange[] = [];
        const stacks: Record<string, number[]> = {};
        const openRegex = /<([a-zA-Z][a-zA-Z0-9]*)\b[^/]*?(?<!\/\s*)>/g;
        const closeRegex = /<\/([a-zA-Z][a-zA-Z0-9]*)\s*>/g;

        for (let i = 0; i < lines.length; i++) {
            let match;

            openRegex.lastIndex = 0;
            while ((match = openRegex.exec(lines[i])) !== null) {
                const tag = match[1].toLowerCase();
                if (!HTML_BLOCK_TAGS.includes(tag)) { continue; }
                if (!stacks[tag]) { stacks[tag] = []; }
                stacks[tag].push(i);
            }

            closeRegex.lastIndex = 0;
            while ((match = closeRegex.exec(lines[i])) !== null) {
                const tag = match[1].toLowerCase();
                if (!HTML_BLOCK_TAGS.includes(tag)) { continue; }
                if (stacks[tag] && stacks[tag].length > 0) {
                    const startLine = stacks[tag].pop()!;
                    if (i > startLine) {
                        ranges.push(new vscode.FoldingRange(startLine, i, vscode.FoldingRangeKind.Region));
                    }
                }
            }
        }
        return ranges;
    }
}