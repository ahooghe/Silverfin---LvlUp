import * as vscode from 'vscode';

interface TagSignature {
    label: string;
    documentation: string;
    parameters: { label: string; documentation: string }[];
}

const TAG_SIGNATURES: Record<string, TagSignature> = {
    'input': {
        label: '{% input "field_path" as:type placeholder:"text" default:"value" %}',
        documentation: 'Renders an input field bound to a custom variable.',
        parameters: [
            { label: '"field_path"', documentation: 'Path to the custom variable (required).' },
            { label: 'as:type', documentation: 'Input type: currency, integer, percentage, text, text_area, select, boolean, date, file, period, accounting.' },
            { label: 'placeholder:"text"', documentation: 'Placeholder text shown when the field is empty.' },
            { label: 'default:"value"', documentation: 'Default value for the input.' },
        ]
    },
    'input_validation': {
        label: '{% input_validation "field_path" min:0 max:100 validation_text:"message" %}',
        documentation: 'Adds validation rules to an input field.',
        parameters: [
            { label: '"field_path"', documentation: 'Path to the custom variable to validate (required).' },
            { label: 'min:value', documentation: 'Minimum allowed value.' },
            { label: 'max:value', documentation: 'Maximum allowed value.' },
            { label: 'min_exclusive:value', documentation: 'Exclusive minimum (value must be greater than).' },
            { label: 'max_exclusive:value', documentation: 'Exclusive maximum (value must be less than).' },
            { label: 'min_length:value', documentation: 'Minimum string length.' },
            { label: 'max_length:value', documentation: 'Maximum string length.' },
            { label: 'pattern:"regex"', documentation: 'Regex pattern the value must match.' },
            { label: 'pattern_flags:"flags"', documentation: 'Regex flags for the pattern (e.g. "i" for case-insensitive).' },
            { label: 'validation_text:"message"', documentation: 'Custom error message shown when validation fails.' },
        ]
    },
    'assign': {
        label: '{% assign variable_name = value | filter %}',
        documentation: 'Assigns a value to a variable.',
        parameters: [
            { label: 'variable_name', documentation: 'Name of the variable to assign.' },
            { label: '= value', documentation: 'Value to assign (string, number, boolean, or expression).' },
            { label: '| filter', documentation: 'Optional filter to transform the value.' },
        ]
    },
    'for': {
        label: '{% for item in collection limit:N offset:N %}',
        documentation: 'Loops over a collection of items.',
        parameters: [
            { label: 'item', documentation: 'Loop variable name.' },
            { label: 'in collection', documentation: 'Collection to iterate over.' },
            { label: 'limit:N', documentation: 'Maximum number of iterations.' },
            { label: 'offset:N', documentation: 'Number of items to skip.' },
        ]
    },
    'fori': {
        label: '{% fori item in collection manual:true %}',
        documentation: 'Loops over a user-managed collection with add/remove row support.',
        parameters: [
            { label: 'item', documentation: 'Loop variable name.' },
            { label: 'in collection', documentation: 'Collection to iterate over.' },
            { label: 'manual:true', documentation: 'Enable manual row management (user can add/remove rows).' },
        ]
    },
    'rollforward': {
        label: '{% rollforward "target" initial:value %}',
        documentation: 'Carries a value forward from the previous period.',
        parameters: [
            { label: '"target"', documentation: 'Name of the rollforward target (required).' },
            { label: 'initial:value', documentation: 'Initial value for the first period.' },
        ]
    },
    't=': {
        label: '{% t= "key" default:"text" nl:"Dutch" fr:"French" en:"English" %}',
        documentation: 'Declares a translation with language definitions.',
        parameters: [
            { label: '"key"', documentation: 'Translation key (required).' },
            { label: 'default:"text"', documentation: 'Default language text (required).' },
            { label: 'nl:"text"', documentation: 'Dutch translation.' },
            { label: 'fr:"text"', documentation: 'French translation.' },
            { label: 'en:"text"', documentation: 'English translation.' },
        ]
    },
    'result': {
        label: '{% result "name" value %}',
        documentation: 'Exposes a value as a named result that other templates can reference.',
        parameters: [
            { label: '"name"', documentation: 'Result name (required).' },
            { label: 'value', documentation: 'Value to expose.' },
        ]
    },
};

function getCurrentTag(lineText: string, charPos: number): string | null {
    const before = lineText.substring(0, charPos);
    const tagMatch = before.match(/\{%-?\s*(\w+)\b/);
    if (!tagMatch) { return null; }
    // Make sure we're still inside the tag (no closing %} before cursor)
    const afterTag = before.substring(tagMatch.index! + tagMatch[0].length);
    if (afterTag.includes('%}')) { return null; }
    return tagMatch[1].toLowerCase();
}

export class SilverfinSignatureHelpProvider implements vscode.SignatureHelpProvider {
    provideSignatureHelp(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.SignatureHelp | null {
        const lineText = document.lineAt(position.line).text;
        const tag = getCurrentTag(lineText, position.character);
        if (!tag || !TAG_SIGNATURES[tag]) { return null; }

        const sig = TAG_SIGNATURES[tag];
        const signatureInfo = new vscode.SignatureInformation(sig.label, sig.documentation);
        signatureInfo.parameters = sig.parameters.map(
            p => new vscode.ParameterInformation(p.label, p.documentation)
        );

        const help = new vscode.SignatureHelp();
        help.signatures = [signatureInfo];
        help.activeSignature = 0;

        // Try to determine which parameter is active based on spaces/colons after the tag keyword
        const before = lineText.substring(0, position.character);
        const tagMatch = before.match(/\{%-?\s*\w+\b/);
        if (tagMatch) {
            const afterKeyword = before.substring(tagMatch.index! + tagMatch[0].length);
            const parts = afterKeyword.trim().split(/\s+/).filter(p => p.length > 0);
            help.activeParameter = Math.min(parts.length, sig.parameters.length - 1);
        }

        return help;
    }
}