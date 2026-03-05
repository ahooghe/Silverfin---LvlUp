export interface FormatterConfig {
    logicBlocks: string[];
    logicSubBlocks: string[];
    liquidBlocks: string[];
    singleLineLogicTags: string[];
    htmlSingleTags: string[];
    htmlInlineTags: string[];
    htmlBlockTags: string[];
    padWithTabs: boolean;
    tabSize: number;
}

export const defaultConfig: FormatterConfig = {
    logicBlocks: ['if', 'for', 'fori', 'ifi', 'unless', 'case', 'stripnewlines'],
    logicSubBlocks: ['else', 'elsif', 'elsifi', 'when'],
    liquidBlocks: ['locale', 'radiogroup', 'currencyconfiguration', 'adjustmentbutton', 'ic', 'nic', 'comment', 'addnewinputs'],
    singleLineLogicTags: ['assign', 'input', 'result', 'push', 'pop', 'newpage', 'include', 'changeorientation', 't', 't=', 'unreconciled', 'newline', 'signmarker', 'rollforward', 'adjustmenttransaction', 'radioinput', 'input_validation', 'add_new_row_button'],
    htmlSingleTags: ['br', 'hr'],
    htmlInlineTags: ['b', 'i', 'em', 'u', 'sub', 'sup', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'],
    htmlBlockTags: ['table', 'thead', 'tbody', 'tr'],
    padWithTabs: true,
    tabSize: 4,
};