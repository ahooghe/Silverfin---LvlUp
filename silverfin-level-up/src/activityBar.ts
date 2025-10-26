import * as vscode from 'vscode';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, basename } from 'path';
import { spawn } from 'child_process';

// ================================================================================================
// INTERFACES AND TYPES
// ================================================================================================

type TemplateType = 'reconciliation' | 'shared_part' | null;

interface TextParts {
    [key: string]: string;
}

// ================================================================================================
// TREE DATA PROVIDERS
// ================================================================================================

/**
 * Tree data provider for the Template view
 * Displays template information and configuration options
 */
export class TemplateProvider implements vscode.TreeDataProvider<TemplateItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TemplateItem | undefined | null | void> = new vscode.EventEmitter<TemplateItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TemplateItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private configData: any = null;
    private templateType: TemplateType = null;

    constructor() {
        this.loadConfigData();
    }

    refresh(): void {
        this.loadConfigData();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TemplateItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TemplateItem): Thenable<TemplateItem[]> {
        if (!element) {
            const templateTypeLabel = this.templateType === 'shared_part' ? 'Shared Part Information' : 'Template Information';
            const configTypeLabel = this.templateType === 'shared_part' ? 'Shared Part Configuration' : 'Template Configuration';
            
            return Promise.resolve([
                new TemplateItem(templateTypeLabel, vscode.TreeItemCollapsibleState.Expanded, 'templateInfo'),
                ...(this.templateType === 'reconciliation' ? [new TemplateItem(configTypeLabel, vscode.TreeItemCollapsibleState.Expanded, 'templateConfig')] : [])
            ]);
        }
        
        if (element.contextValue === 'templateInfo') {
            return this.getTemplateInfoItems();
        }
        
        if (element.contextValue === 'templateConfig') {
            return this.getTemplateConfigItems();
        }
        
        return Promise.resolve([]);
    }

    public getTemplateHandle(): string | null {
        if (!this.configData) return null;
        
        if (this.templateType === 'reconciliation' && this.configData.handle) {
            return this.configData.handle;
        }
        
        if (this.templateType === 'shared_part' && this.configData.name) {
            return this.configData.name;
        }
        
        return null;
    }

    public getTemplateType(): TemplateType {
        return this.templateType;
    }

    public findConfigFile(): string | null {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return null;

        const currentDir = dirname(activeEditor.document.uri.fsPath);
        
        let configPath = join(currentDir, 'config.json');
        if (existsSync(configPath)) {
            return configPath;
        }

        const dirName = basename(currentDir);
        if (dirName === 'text_parts') {
            const parentDir = dirname(currentDir);
            configPath = join(parentDir, 'config.json');
            if (existsSync(configPath)) {
                return configPath;
            }
        }

        return null;
    }

    private getTemplateInfoItems(): Promise<TemplateItem[]> {
        const items: TemplateItem[] = [];
        
        if (!this.configData) {
            items.push(new TemplateItem('No config.json file found', vscode.TreeItemCollapsibleState.None, 'info'));
            return Promise.resolve(items);
        }

        // Template type indicator
        const typeIcon = this.templateType === 'shared_part' ? '🔵' : '🟠';
        const typeLabel = this.templateType === 'shared_part' ? 'Shared Part' : 'Reconciliation Template';
        items.push(new TemplateItem(`${typeIcon} Type: ${typeLabel}`, vscode.TreeItemCollapsibleState.None, 'info'));

        if (this.templateType === 'shared_part') {
            this.addSharedPartInfo(items);
        } else {
            this.addReconciliationTemplateInfo(items);
        }

        return Promise.resolve(items);
    }

    private getTemplateConfigItems(): Promise<TemplateItem[]> {
        const items: TemplateItem[] = [];
        
        if (!this.configData) {
            items.push(new TemplateItem('No config.json file found', vscode.TreeItemCollapsibleState.None, 'info'));
            return Promise.resolve(items);
        }

        if (this.templateType === 'reconciliation') {
            this.addReconciliationConfig(items);
        }

        return Promise.resolve(items);
    }

    private addSharedPartInfo(items: TemplateItem[]): void {
        if (this.configData.name) {
            items.push(new TemplateItem(`Name: ${this.configData.name}`, vscode.TreeItemCollapsibleState.None, 'info'));
        }
        
        if (this.configData.text) {
            items.push(new TemplateItem(`File: ${this.configData.text}`, vscode.TreeItemCollapsibleState.None, 'info'));
        }
    }

    private addReconciliationTemplateInfo(items: TemplateItem[]): void {
        if (this.configData.handle) {
            items.push(new TemplateItem(`Handle: ${this.configData.handle}`, vscode.TreeItemCollapsibleState.None, 'info'));
        }

        ['name_en', 'name_nl', 'name_fr'].forEach(field => {
            if (this.configData[field]) {
                const lang = field.split('_')[1].toUpperCase();
                items.push(new TemplateItem(`Name (${lang}): ${this.configData[field]}`, vscode.TreeItemCollapsibleState.None, 'info'));
            }
        });

        if (this.configData.virtual_account_number?.trim()) {
            items.push(new TemplateItem(`Virtual Account: ${this.configData.virtual_account_number}`, vscode.TreeItemCollapsibleState.None, 'info'));
        }

        if (this.configData.text) {
            items.push(new TemplateItem(`Main File: ${this.configData.text}`, vscode.TreeItemCollapsibleState.None, 'info'));
        }
    }

    private addReconciliationConfig(items: TemplateItem[]): void {
        const booleanFields = [
            'externally_managed', 'public', 'allow_duplicate_reconciliation', 
            'is_active', 'use_full_width', 'downloadable_as_docx', 'hide_code', 'published'
        ];

        booleanFields.forEach(field => {
            if (field in this.configData) {
                const value = this.configData[field];
                const displayName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const statusIcon = value ? '🟢' : '🔴';
                const statusText = value ? 'Enabled' : 'Disabled';
                items.push(new TemplateItem(
                    `${statusIcon} ${displayName}: ${statusText}`,
                    vscode.TreeItemCollapsibleState.None,
                    'configToggle',
                    field,
                    value
                ));
            }
        });

        if (this.configData.reconciliation_type) {
            items.push(new TemplateItem(
                `⚙️ Reconciliation Type: ${this.configData.reconciliation_type}`,
                vscode.TreeItemCollapsibleState.None,
                'configDropdown',
                'reconciliation_type',
                this.configData.reconciliation_type
            ));
        }

        if (this.configData.auto_hide_formula !== undefined) {
            const formula = this.configData.auto_hide_formula || '(empty)';
            items.push(new TemplateItem(
                `📝 Auto Hide Formula: ${formula}`,
                vscode.TreeItemCollapsibleState.None,
                'configInput',
                'auto_hide_formula',
                this.configData.auto_hide_formula
            ));
        }

        items.push(new TemplateItem(
            '📁 Add Text Parts to Config',
            vscode.TreeItemCollapsibleState.None,
            'addTextParts'
        ));
    }

    private loadConfigData(): void {
        try {
            const configPath = this.findConfigFile();
            if (configPath && existsSync(configPath)) {
                const configContent = readFileSync(configPath, 'utf8');
                this.configData = JSON.parse(configContent);
                this.templateType = this.determineTemplateType(configPath);
            } else {
                this.configData = null;
                this.templateType = null;
            }
        } catch (error) {
            console.error('Error loading config file:', error);
            this.configData = null;
            this.templateType = null;
        }
    }

    private determineTemplateType(configPath: string): TemplateType {
        if (configPath.includes('shared_parts')) return 'shared_part';
        if (configPath.includes('reconciliation_texts')) return 'reconciliation';

        if (this.configData) {
            if (this.configData.name && this.configData.used_in) return 'shared_part';
            if (this.configData.handle && this.configData.reconciliation_type !== undefined) return 'reconciliation';
        }

        return null;
    }
}

/**
 * Tree data provider for the Development view
 * Provides context-aware development actions
 */
export class DevelopmentProvider implements vscode.TreeDataProvider<DevelopmentItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DevelopmentItem | undefined | null | void> = new vscode.EventEmitter<DevelopmentItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DevelopmentItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private templateProvider: TemplateProvider) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DevelopmentItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: DevelopmentItem): Thenable<DevelopmentItem[]> {
        if (element) return Promise.resolve([]);

        const templateType = this.templateProvider.getTemplateType();
        const buttons = this.createDevelopmentButtons(templateType);
        
        return Promise.resolve(buttons);
    }

    private createDevelopmentButtons(templateType: TemplateType): DevelopmentItem[] {
        let syncButtonText = '🔄 Sync Template';
        
        if (templateType === 'shared_part') {
            syncButtonText = '🔄 Sync Shared Part';
        } else if (templateType === 'reconciliation') {
            syncButtonText = '🔄 Sync Reconciliation Template';
        }

        const buttons = [
            new DevelopmentItem(syncButtonText, 'silverfin-lvlup.syncTemplate'),
            new DevelopmentItem('🔄 Update All Reconciliations', 'silverfin-lvlup.updateAllReconciliations')
        ];

        if (templateType === 'reconciliation') {
            buttons.push(new DevelopmentItem('➕ Add Shared Parts to Template', 'silverfin-lvlup.addSharedPartsToTemplate'));
        }

        return buttons;
    }
}

/**
 * Tree data provider for the CLI Information view
 * Displays CLI status and information (placeholder for future implementation)
 */
export class CLIInfoProvider implements vscode.TreeDataProvider<CLIInfoItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CLIInfoItem | undefined | null | void> = new vscode.EventEmitter<CLIInfoItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CLIInfoItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private cliInfo: string[] = [
        'CLI integration pending...',
        'Will extract data from Silverfin CLI'
    ];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: CLIInfoItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: CLIInfoItem): Thenable<CLIInfoItem[]> {
        if (element) return Promise.resolve([]);
        
        return Promise.resolve(
            this.cliInfo.map(info => new CLIInfoItem(info, vscode.TreeItemCollapsibleState.None))
        );
    }

    updateCLIInfo(newInfo: string[]): void {
        this.cliInfo = newInfo;
        this.refresh();
    }
}

// ================================================================================================
// TREE ITEM CLASSES
// ================================================================================================

/**
 * Template tree item with context-aware commands and icons
 */
class TemplateItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string,
        public readonly fieldName?: string,
        public readonly fieldValue?: any
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
        this.setupContextualBehavior();
    }

    private setupContextualBehavior(): void {
        const contextActions: Record<string, { icon?: string; command?: string; args?: any[] }> = {
            configFile: { icon: 'file', command: 'silverfin-lvlup.openConfigFile' },
            configToggle: { command: 'silverfin-lvlup.toggleConfigValue', args: [this.fieldName, this.fieldValue] },
            configDropdown: { icon: 'list-selection', command: 'silverfin-lvlup.changeReconciliationType', args: [this.fieldName, this.fieldValue] },
            configInput: { icon: 'edit', command: 'silverfin-lvlup.editConfigValue', args: [this.fieldName, this.fieldValue] },
            addTextParts: { icon: 'add', command: 'silverfin-lvlup.addTextPartsToConfig' },
            info: { icon: 'info' },
            filePart: { icon: 'file-code' },
            fileStructure: { icon: 'folder' },
            fileStructureHeader: { icon: 'folder' }
        };

        const action = contextActions[this.contextValue || ''];
        if (action) {
            if (action.icon) {
                this.iconPath = new vscode.ThemeIcon(action.icon);
            }
            if (action.command) {
                this.command = {
                    command: action.command,
                    title: action.command.split('.').pop() || '',
                    arguments: action.args
                };
            }
        }
    }
}

/**
 * Development tree item with appropriate icons
 */
class DevelopmentItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly commandId: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = this.label;
        this.iconPath = this.getIconForCommand(commandId);
        this.command = {
            command: commandId,
            title: this.label
        };
    }

    private getIconForCommand(commandId: string): vscode.ThemeIcon {
        if (commandId.includes('sync') || commandId.includes('update')) {
            return new vscode.ThemeIcon('sync');
        }
        if (commandId.includes('add')) {
            return new vscode.ThemeIcon('add');
        }
        return new vscode.ThemeIcon('play');
    }
}

/**
 * CLI Information tree item
 */
class CLIInfoItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
        this.iconPath = new vscode.ThemeIcon('terminal');
    }
}

// ================================================================================================
// COMMAND REGISTRATION AND ACTIVATION
// ================================================================================================

/**
 * Activates the activity bar providers and registers all commands
 * Main entry point for the activity bar functionality
 */
export function activateActivityBar(context: vscode.ExtensionContext) {
    console.log('Activating Silverfin activity bar...');
    
    const { providers, outputChannel } = createProviders();
    registerTreeDataProviders(providers);
    setupContextAndListeners(providers);
    registerAllCommands(context, providers, outputChannel);
    
    console.log('Silverfin activity bar activated successfully');
    return providers;
}

/**
 * Creates and returns all tree data providers and output channel
 */
function createProviders() {
    const outputChannel = vscode.window.createOutputChannel('Silverfin CLI');
    const templateProvider = new TemplateProvider();
    const developmentProvider = new DevelopmentProvider(templateProvider);
    const cliInfoProvider = new CLIInfoProvider();

    return {
        providers: { templateProvider, developmentProvider, cliInfoProvider },
        outputChannel
    };
}

/**
 * Registers all tree data providers with VS Code
 */
function registerTreeDataProviders(providers: { templateProvider: TemplateProvider; developmentProvider: DevelopmentProvider; cliInfoProvider: CLIInfoProvider }) {
    vscode.window.registerTreeDataProvider('silverfin-template', providers.templateProvider);
    vscode.window.registerTreeDataProvider('silverfin-development', providers.developmentProvider);
    vscode.window.registerTreeDataProvider('silverfin-cli-info', providers.cliInfoProvider);
    console.log('Registered tree data providers');
}

/**
 * Sets up context and event listeners
 */
function setupContextAndListeners(providers: { templateProvider: TemplateProvider; developmentProvider: DevelopmentProvider; cliInfoProvider: CLIInfoProvider }) {
    vscode.commands.executeCommand('setContext', 'silverfin-lvlup.active', true);

    vscode.window.onDidChangeActiveTextEditor(() => {
        providers.templateProvider.refresh();
        providers.developmentProvider.refresh();
    });
}

/**
 * Registers all VS Code commands for the activity bar
 */
function registerAllCommands(
    context: vscode.ExtensionContext,
    providers: { templateProvider: TemplateProvider; developmentProvider: DevelopmentProvider; cliInfoProvider: CLIInfoProvider },
    outputChannel: vscode.OutputChannel
) {
    context.subscriptions.push(outputChannel);

    const commands = [
        // Template commands
        ['silverfin-lvlup.refreshTemplateInfo', () => providers.templateProvider.refresh()],
        ['silverfin-lvlup.openConfigFile', () => openConfigFile(providers.templateProvider)],
        ['silverfin-lvlup.toggleConfigValue', (fieldName: string, currentValue: boolean) => toggleConfigValue(providers.templateProvider, fieldName, currentValue)],
        ['silverfin-lvlup.changeReconciliationType', (fieldName: string, currentValue: string) => changeReconciliationType(providers.templateProvider, fieldName, currentValue)],
        ['silverfin-lvlup.editConfigValue', (fieldName: string, currentValue: any) => editConfigValue(providers.templateProvider, fieldName, currentValue)],
        
        // Development commands
        ['silverfin-lvlup.syncTemplate', () => syncTemplate(providers.templateProvider, outputChannel)],
        ['silverfin-lvlup.updateAllReconciliations', () => updateAllReconciliations(outputChannel)],
        ['silverfin-lvlup.addSharedPartsToTemplate', () => addSharedPartsToTemplate(providers.templateProvider, outputChannel)],
        ['silverfin-lvlup.addTextPartsToConfig', () => addTextPartsToConfig(providers.templateProvider)],
        
        // Placeholder commands
        ['silverfin-lvlup.placeholder1', () => vscode.window.showInformationMessage('Development Action 1 triggered')],
        ['silverfin-lvlup.placeholder2', () => vscode.window.showInformationMessage('Development Action 2 triggered')],
        ['silverfin-lvlup.buildTemplate', () => vscode.window.showInformationMessage('Build Template triggered')],
        ['silverfin-lvlup.testTemplate', () => vscode.window.showInformationMessage('Test Template triggered')]
    ];

    commands.forEach(([commandId, handler]) => {
        context.subscriptions.push(vscode.commands.registerCommand(commandId as string, handler as any));
    });
}

// ================================================================================================
// COMMAND IMPLEMENTATIONS
// ================================================================================================

/**
 * Opens the config.json file in the editor
 */
async function openConfigFile(templateProvider: TemplateProvider): Promise<void> {
    const configPath = templateProvider.findConfigFile();
    if (configPath) {
        const uri = vscode.Uri.file(configPath);
        await vscode.window.showTextDocument(uri);
    } else {
        vscode.window.showInformationMessage('No config.json file found in current directory or parent directory.');
    }
}

/**
 * Toggles a boolean configuration value
 */
async function toggleConfigValue(templateProvider: TemplateProvider, fieldName: string, currentValue: boolean): Promise<void> {
    const configPath = templateProvider.findConfigFile();
    if (!configPath) return;

    try {
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        config[fieldName] = !currentValue;
        
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        templateProvider.refresh();
        vscode.window.showInformationMessage(`${fieldName.replace(/_/g, ' ')} ${config[fieldName] ? 'enabled' : 'disabled'}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to update config: ${error}`);
    }
}

/**
 * Changes the reconciliation type via dropdown selection
 */
async function changeReconciliationType(templateProvider: TemplateProvider, fieldName: string, currentValue: string): Promise<void> {
    const options = [
        'reconciliation_not_necessary',
        'can_be_reconciled_without_data',
        'only_reconciled_with_data'
    ];
    
    const selected = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select reconciliation type',
        canPickMany: false
    });
    
    if (!selected || selected === currentValue) return;

    const configPath = templateProvider.findConfigFile();
    if (!configPath) return;

    try {
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        config[fieldName] = selected;
        
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        templateProvider.refresh();
        vscode.window.showInformationMessage(`Reconciliation type changed to: ${selected}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to update config: ${error}`);
    }
}

/**
 * Edits a configuration value via input box
 */
async function editConfigValue(templateProvider: TemplateProvider, fieldName: string, currentValue: any): Promise<void> {
    const newValue = await vscode.window.showInputBox({
        prompt: `Enter new value for ${fieldName.replace(/_/g, ' ')}`,
        value: currentValue || ''
    });
    
    if (newValue === undefined || newValue === currentValue) return;

    const configPath = templateProvider.findConfigFile();
    if (!configPath) return;

    try {
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        config[fieldName] = newValue;
        
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        templateProvider.refresh();
        vscode.window.showInformationMessage(`${fieldName.replace(/_/g, ' ')} updated`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to update config: ${error}`);
    }
}

/**
 * Syncs the current template with Silverfin CLI
 */
async function syncTemplate(templateProvider: TemplateProvider, outputChannel: vscode.OutputChannel): Promise<void> {
    const handle = templateProvider.getTemplateHandle();
    const templateType = templateProvider.getTemplateType();
    
    if (!handle) {
        vscode.window.showErrorMessage('No template handle found. Make sure you have a valid config.json file.');
        return;
    }

    try {
        const [command, args] = templateType === 'shared_part' 
            ? ['silverfin', ['update-shared-part', '--shared-part', handle, '--yes']]
            : ['silverfin', ['update-reconciliation', '--handle', handle, '--yes']];

        vscode.window.showInformationMessage(`Syncing ${templateType === 'shared_part' ? 'shared part' : 'reconciliation template'}: ${handle}`);
        await runSilverfinCommand(command, args, outputChannel);
        vscode.window.showInformationMessage(`✅ Successfully synced: ${handle}`);
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to sync template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Updates all reconciliations via Silverfin CLI
 */
async function updateAllReconciliations(outputChannel: vscode.OutputChannel): Promise<void> {
    try {
        vscode.window.showInformationMessage('Updating all reconciliations...');
        await runSilverfinCommand('silverfin', ['update-reconciliation', '--all', '--yes'], outputChannel);
        vscode.window.showInformationMessage('✅ Successfully updated all reconciliations');
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to update reconciliations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Adds shared parts to the current template via Silverfin CLI
 */
async function addSharedPartsToTemplate(templateProvider: TemplateProvider, outputChannel: vscode.OutputChannel): Promise<void> {
    const templateHandle = templateProvider.getTemplateHandle();
    const templateType = templateProvider.getTemplateType();
    
    if (templateType !== 'reconciliation' || !templateHandle) {
        vscode.window.showErrorMessage('This command is only available for reconciliation templates.');
        return;
    }

    try {
        const sharedPartHandles = extractSharedPartHandles(templateProvider);
        
        if (sharedPartHandles.length === 0) {
            vscode.window.showInformationMessage('No shared part includes found in template files.');
            return;
        }

        vscode.window.showInformationMessage(`Found ${sharedPartHandles.length} shared part(s): ${sharedPartHandles.join(', ')}`);
        
        for (const sharedPartHandle of sharedPartHandles) {
            outputChannel.appendLine(`Adding shared part: ${sharedPartHandle}`);
            await runSilverfinCommand('silverfin', ['add-shared-part', '--handle', templateHandle, '--shared-part', sharedPartHandle, '--yes'], outputChannel);
        }
        
        vscode.window.showInformationMessage(`✅ Successfully added ${sharedPartHandles.length} shared part(s) to template: ${templateHandle}`);
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to add shared parts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Adds text parts to the configuration file
 */
async function addTextPartsToConfig(templateProvider: TemplateProvider): Promise<void> {
    const templateType = templateProvider.getTemplateType();
    
    if (templateType !== 'reconciliation') {
        vscode.window.showErrorMessage('This command is only available for reconciliation templates.');
        return;
    }

    try {
        const configPath = templateProvider.findConfigFile();
        if (!configPath) {
            vscode.window.showErrorMessage('No config.json file found.');
            return;
        }

        const textParts = extractTextParts(templateProvider);
        
        if (Object.keys(textParts).length === 0) {
            vscode.window.showInformationMessage('No text part includes found in template files.');
            return;
        }

        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        
        if (!config.text_parts) {
            config.text_parts = {};
        }

        const addedParts: string[] = [];
        
        for (const [partName, partPath] of Object.entries(textParts)) {
            if (!config.text_parts[partName]) {
                config.text_parts[partName] = partPath;
                addedParts.push(partName);
            }
        }

        if (addedParts.length === 0) {
            vscode.window.showInformationMessage('All text parts are already present in config.json.');
            return;
        }

        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        templateProvider.refresh();
        
        vscode.window.showInformationMessage(`✅ Added ${addedParts.length} text part(s) to config: ${addedParts.join(', ')}`);
    } catch (error) {
        vscode.window.showErrorMessage(`❌ Failed to add text parts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// ================================================================================================
// UTILITY FUNCTIONS
// ================================================================================================

/**
 * Executes Silverfin CLI commands in the background and logs output
 */
function runSilverfinCommand(command: string, args: string[], outputChannel: vscode.OutputChannel): Promise<void> {
    return new Promise((resolve, reject) => {
        outputChannel.show(true);
        outputChannel.appendLine(`Running: ${command} ${args.join(' ')}`);
        outputChannel.appendLine('');
        
        const process = spawn(command, args, {
            shell: true,
            cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
        });

        process.stdout?.on('data', (data) => outputChannel.append(data.toString()));
        process.stderr?.on('data', (data) => outputChannel.append(data.toString()));

        process.on('close', (code) => {
            outputChannel.appendLine('');
            if (code === 0) {
                outputChannel.appendLine(`✅ Command completed successfully (exit code: ${code})`);
                resolve();
            } else {
                outputChannel.appendLine(`❌ Command failed with exit code: ${code}`);
                reject(new Error(`Command failed with exit code: ${code}`));
            }
            outputChannel.appendLine(''.padEnd(50, '-'));
        });

        process.on('error', (error) => {
            outputChannel.appendLine(`❌ Error running command: ${error.message}`);
            outputChannel.appendLine(''.padEnd(50, '-'));
            reject(error);
        });
    });
}

/**
 * Extracts shared part handles from liquid template files
 */
function extractSharedPartHandles(templateProvider: TemplateProvider): string[] {
    return extractFromTemplateFiles(templateProvider, /{%\s*include\s+["']shared\/([^"']+)["']\s*%}/g);
}

/**
 * Extracts text parts from liquid template files
 */
function extractTextParts(templateProvider: TemplateProvider): TextParts {
    const handles = extractFromTemplateFiles(templateProvider, /{%\s*include\s+["']parts\/([^"']+)["']\s*%}/g);
    const textParts: TextParts = {};
    
    handles.forEach(handle => {
        textParts[handle] = `text_parts/${handle}.liquid`;
    });
    
    return textParts;
}

/**
 * Generic function to extract patterns from template files
 */
function extractFromTemplateFiles(templateProvider: TemplateProvider, regex: RegExp): string[] {
    const handles = new Set<string>();
    
    try {
        const configPath = templateProvider.findConfigFile();
        if (!configPath) return [];

        const templateDir = dirname(configPath);
        const configData = (templateProvider as any).configData;
        if (!configData) return [];

        const filesToParse = getFilesToParse(configData, templateDir);
        
        filesToParse.forEach(filePath => {
            try {
                const content = readFileSync(filePath, 'utf8');
                let match;
                
                while ((match = regex.exec(content)) !== null) {
                    const handle = match[1].trim();
                    if (handle) handles.add(handle);
                }
            } catch (error) {
                console.error(`Error reading file ${filePath}:`, error);
            }
        });
        
    } catch (error) {
        console.error('Error extracting from template files:', error);
    }
    
    return Array.from(handles);
}

/**
 * Gets list of liquid files to parse based on config data
 */
function getFilesToParse(configData: any, templateDir: string): string[] {
    const filesToParse: string[] = [];
    
    if (configData.text) {
        const mainFile = join(templateDir, configData.text);
        if (existsSync(mainFile)) {
            filesToParse.push(mainFile);
        }
    }

    if (configData.text_parts && typeof configData.text_parts === 'object') {
        Object.values(configData.text_parts).forEach(filePath => {
            if (typeof filePath === 'string') {
                const fullPath = join(templateDir, filePath);
                if (existsSync(fullPath)) {
                    filesToParse.push(fullPath);
                }
            }
        });
    }
    
    return filesToParse;
}
