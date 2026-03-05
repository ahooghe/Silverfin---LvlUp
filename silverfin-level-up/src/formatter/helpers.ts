import { FormatterConfig } from './config';

export function setIndent(line: string, level: number, config: FormatterConfig): string {
    const indent = config.padWithTabs ? '\t'.repeat(level) : ' '.repeat(config.tabSize * level);
    return indent + line;
}

export function cleanHtml(line: string): string {
    return line.replace(/<[^>]*>/g, tag =>
        tag.replace(/<\s+/g, '<').replace(/\s+>/g, '>').replace(/\s*(class|colspan)\s*=\s*/g, ' $1=')
    );
}

export function cleanLiquid(line: string): string {
    return line.replace(/^\s*({{.*?}}|{%-.*?-%})\s*$/, '$1');
}

export function cleanMarkdown(line: string): string {
    return line.replace(/^\s*(\*\*.*?\*\*|\*.*?\*|__.*?__|_.*?_)\s*$/, '$1');
}