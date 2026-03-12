import * as vscode from 'vscode';
import { existsSync, readFileSync } from 'fs';
import { dirname, join, basename } from 'path';
import { TemplateType, SilverfinEnvironment, CLIVersionInfo, escapeHtml, getSharedCSS, getIconSvg } from './helpers';
import { readCLIConfig, getCLIDefaultFirmId, detectCLIVersion, seedEnvironmentsFromConfig } from './cliUtils';

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
 * Webview provider for the Development panel
 */
export class DevelopmentWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private templateProvider: TemplateProvider) {}

    refresh(): void {
        if (this._view) {
            this._view.webview.html = this.getHtml();
        }
    }

    resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getHtml();

        webviewView.webview.onDidReceiveMessage(msg => {
            if (msg.command) {
                vscode.commands.executeCommand(msg.command);
            }
        });
    }

    private getHtml(): string {
        const templateType = this.templateProvider.getTemplateType();
        let syncLabel = 'Sync Template';
        let syncIcon = 'refresh';
        if (templateType === 'shared_part') { syncLabel = 'Sync Shared Part'; syncIcon = 'refresh'; }
        else if (templateType === 'reconciliation') { syncLabel = 'Sync Reconciliation'; syncIcon = 'refresh'; }

        const templateActions: { label: string; cmd: string; icon: string; style: string }[] = [
            { label: syncLabel, cmd: 'silverfin-lvlup.syncTemplate', icon: syncIcon, style: 'primary' },
            { label: 'Create Reconciliation', cmd: 'silverfin-lvlup.createReconciliation', icon: 'plus', style: 'secondary' },
            { label: 'Create Shared Part', cmd: 'silverfin-lvlup.createSharedPart', icon: 'plus', style: 'secondary' },
        ];

        if (templateType === 'reconciliation') {
            templateActions.push({ label: 'Add Shared Parts', cmd: 'silverfin-lvlup.addSharedPartsToTemplate', icon: 'link', style: 'secondary' });
        }

        const templateButtons = templateActions.map(a =>
            `<button class="action-btn ${a.style}" onclick="send('${a.cmd}')">
                <span class="btn-icon">${getIconSvg(a.icon)}</span>${a.label}
            </button>`
        ).join('');

        return `<!DOCTYPE html>
<html><head><style>${getSharedCSS()}
.section { margin-bottom: 16px; }
.section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; padding: 0 2px; }
.action-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-family: var(--vscode-font-family); margin-bottom: 4px; transition: all 0.15s ease; }
.action-btn:hover { filter: brightness(1.2); }
.action-btn.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.action-btn.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
.action-btn.danger { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: 1px solid var(--vscode-editorWarning-foreground); }
.action-btn.danger:hover { background: color-mix(in srgb, var(--vscode-editorWarning-foreground) 20%, var(--vscode-button-secondaryBackground)); }
.btn-icon { display: flex; align-items: center; }
.btn-icon svg { width: 14px; height: 14px; }
.separator { height: 1px; background: var(--vscode-widget-border); margin: 14px 0; opacity: 0.4; }
</style></head><body>
<div class="section">
    <div class="section-title">Template Actions</div>
    ${templateButtons}
</div>
<div class="separator"></div>
<div class="section">
    <div class="section-title">Testing</div>
    <button class="action-btn primary" onclick="send('silverfin-lvlup.runTestCurrent')">
        <span class="btn-icon">${getIconSvg('play')}</span>Run Tests
    </button>
    <button class="action-btn secondary" onclick="send('silverfin-lvlup.runTestSelect')">
        <span class="btn-icon">${getIconSvg('play')}</span>Select & Run Multiple
    </button>
</div>
<div class="separator"></div>
<div class="section">
    <div class="section-title">Bulk Actions</div>
    <button class="action-btn danger" onclick="send('silverfin-lvlup.updateAllReconciliations')">
        <span class="btn-icon">${getIconSvg('alert')}</span>Update All Reconciliations
    </button>
</div>
<script>const vscode = acquireVsCodeApi(); function send(cmd) { vscode.postMessage({ command: cmd }); }</script>
</body></html>`;
    }
}

/**
 * Webview provider for the CLI Information panel
 */
export class CLIInfoWebviewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private versionInfo: CLIVersionInfo | null = null;
    private loading = true;

    constructor() {
        this.loadCLIInfo();
    }

    refresh(): void {
        this.loadCLIInfo();
    }

    resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getHtml();

        webviewView.webview.onDidReceiveMessage(msg => {
            if (msg.command) {
                vscode.commands.executeCommand(msg.command, msg.arg);
            }
        });
    }

    private updateView(): void {
        if (this._view) {
            this._view.webview.html = this.getHtml();
        }
    }

    private loadCLIInfo(): void {
        this.loading = true;
        this.updateView();

        detectCLIVersion().then(info => {
            this.versionInfo = info;
            this.loading = false;
            seedEnvironmentsFromConfig();
            this.updateView();
        }).catch(() => {
            this.versionInfo = null;
            this.loading = false;
            seedEnvironmentsFromConfig();
            this.updateView();
        });
    }

    private getHtml(): string {
        const versionHtml = this.getVersionHtml();
        const envHtml = this.getEnvironmentHtml();

        return `<!DOCTYPE html>
<html><head><style>${getSharedCSS()}
.version-banner { display: flex; align-items: center; justify-content: space-between; background: var(--vscode-editor-background); border: 1px solid var(--vscode-widget-border); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; }
.version-left { display: flex; align-items: center; gap: 8px; }
.version-label { font-size: 12px; color: var(--vscode-descriptionForeground); }
.version-number { font-size: 13px; font-weight: 600; color: var(--vscode-foreground); font-family: var(--vscode-editor-font-family); }
.version-dot { width: 8px; height: 8px; border-radius: 50%; }
.version-dot.ok { background: #38a169; }
.version-dot.update { background: #dd6b20; animation: pulse 2s infinite; }
.version-dot.error { background: #c53030; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.update-btn { padding: 4px 10px; font-size: 11px; border: none; border-radius: 4px; cursor: pointer; background: #dd6b20; color: #fff; font-family: var(--vscode-font-family); transition: background 0.15s; }
.update-btn:hover { background: #ed8936; }
.section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--vscode-descriptionForeground); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
.env-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 6px; margin-bottom: 4px; cursor: pointer; border: 1px solid transparent; transition: all 0.15s ease; }
.env-row:hover { background: var(--vscode-list-hoverBackground); border-color: var(--vscode-widget-border); }
.env-row.active { background: color-mix(in srgb, var(--vscode-button-background) 15%, transparent); border-color: var(--vscode-button-background); }
.env-info { flex: 1; min-width: 0; }
.env-name { font-size: 12px; font-weight: 500; color: var(--vscode-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.env-id { font-size: 10px; color: var(--vscode-descriptionForeground); font-family: var(--vscode-editor-font-family); }
.badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; vertical-align: middle; margin-right: 4px; }
.badge.prod { background: #c53030; color: #fff; }
.badge.active { background: #38a169; color: #fff; }
.badge.warn { background: #dd6b20; color: #fff; }
.badge.default { background: #3182ce; color: #fff; }
.env-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; }
.env-row:hover .env-actions { opacity: 1; }
.icon-btn { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: none; border-radius: 4px; cursor: pointer; background: transparent; color: var(--vscode-descriptionForeground); transition: all 0.15s; }
.icon-btn:hover { background: var(--vscode-toolbar-hoverBackground); color: var(--vscode-foreground); }
.icon-btn svg { width: 14px; height: 14px; }
.add-row { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border-radius: 6px; margin-top: 4px; cursor: pointer; border: 1px dashed var(--vscode-widget-border); color: var(--vscode-descriptionForeground); font-size: 11px; transition: all 0.15s; }
.add-row:hover { border-color: var(--vscode-button-background); color: var(--vscode-button-background); background: color-mix(in srgb, var(--vscode-button-background) 8%, transparent); }
.add-row svg { width: 12px; height: 12px; }
</style></head><body>
${versionHtml}
${envHtml}
<script>
const vscode = acquireVsCodeApi();
function send(cmd, arg) { vscode.postMessage({ command: cmd, arg: arg }); }
</script>
</body></html>`;
    }

    private getVersionHtml(): string {
        if (this.loading) {
            return `<div class="version-banner">
                <div class="version-left"><span class="version-label">Loading CLI info...</span></div>
            </div>`;
        }

        if (!this.versionInfo) {
            return `<div class="version-banner">
                <div class="version-left">
                    <span class="version-dot error"></span>
                    <span class="version-label">CLI not detected</span>
                </div>
            </div>`;
        }

        if (this.versionInfo.updateAvailable && this.versionInfo.latestVersion) {
            return `<div class="version-banner">
                <div class="version-left">
                    <span class="version-dot update"></span>
                    <span class="version-number">v${this.versionInfo.currentVersion}</span>
                    <span class="version-label">&rarr; v${this.versionInfo.latestVersion}</span>
                </div>
                <button class="update-btn" onclick="send('silverfin-lvlup.updateCLI')">Update</button>
            </div>`;
        }

        return `<div class="version-banner">
            <div class="version-left">
                <span class="version-dot ok"></span>
                <span class="version-number">v${this.versionInfo.currentVersion}</span>
                <span class="version-label">Up to date</span>
            </div>
        </div>`;
    }

    private getEnvironmentHtml(): string {
        const config = vscode.workspace.getConfiguration('silverfinLvlUp');
        const environments: SilverfinEnvironment[] = config.get('environments', []);
        const activeEnvId = config.get<string>('activeEnvironment', '');
        const cliConfig = readCLIConfig();
        const cliDefaultFirmId = getCLIDefaultFirmId(cliConfig);

        const envRows = environments.map(env => {
            const isActive = env.firmId === activeEnvId;
            const isAuthorized = cliConfig !== null && env.firmId in cliConfig;
            const isCLIDefault = env.firmId === cliDefaultFirmId;

            let badges = '';
            if (env.isProd) { badges += '<span class="badge prod">PROD</span>'; }
            if (isActive) { badges += '<span class="badge active">Active</span>'; }
            if (isCLIDefault && !isActive) { badges += '<span class="badge default">CLI Default</span>'; }
            if (!isAuthorized) { badges += '<span class="badge warn">Unauth</span>'; }

            const activeClass = isActive ? ' active' : '';

            return `<div class="env-row${activeClass}" onclick="send('silverfin-lvlup.setActiveEnvironment', '${env.firmId}')" title="Click to ${isActive ? 'deactivate' : 'set as active'}">
                <div class="env-info">
                    <div class="env-name">${badges}${escapeHtml(env.firmName)}</div>
                    <div class="env-id">${env.firmId}</div>
                </div>
                <div class="env-actions">
                    <button class="icon-btn" onclick="event.stopPropagation(); send('silverfin-lvlup.toggleProdEnvironment', '${env.firmId}')" title="${env.isProd ? 'Unmark production' : 'Mark as production'}">
                        ${getIconSvg('shield')}
                    </button>
                    <button class="icon-btn" onclick="event.stopPropagation(); send('silverfin-lvlup.removeEnvironment', '${env.firmId}')" title="Remove environment">
                        ${getIconSvg('trash')}
                    </button>
                </div>
            </div>`;
        }).join('');

        return `<div class="section-title">Environments</div>
${envRows}
<div class="add-row" onclick="send('silverfin-lvlup.addEnvironment')">
    ${getIconSvg('plus')} Add environment
</div>`;
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
