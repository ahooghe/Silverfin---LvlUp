import * as vscode from 'vscode';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, basename } from 'path';
import { spawn } from 'child_process';
import { homedir } from 'os';

// ================================================================================================
// INTERFACES AND TYPES
// ================================================================================================

type TemplateType = 'reconciliation' | 'shared_part' | null;

interface TextParts {
    [key: string]: string;
}

interface SilverfinEnvironment {
    firmId: string;
    firmName: string;
    isProd: boolean;
}

interface CLIVersionInfo {
    currentVersion: string;
    latestVersion: string | null;
    updateAvailable: boolean;
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

// ================================================================================================
// WEBVIEW HELPERS
// ================================================================================================

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getSharedCSS(): string {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { padding: 12px; font-family: var(--vscode-font-family); font-size: 12px; color: var(--vscode-foreground); background: transparent; }
    `;
}

function getIconSvg(name: string): string {
    const icons: Record<string, string> = {
        refresh: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.45 5.22A6 6 0 1 0 14 8h-1.5a4.5 4.5 0 1 1-.72-2.45L10 7h5V2l-1.55 3.22z"/></svg>',
        plus: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>',
        link: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M6.8 11.2a3.5 3.5 0 0 1 0-4.95l.7-.7a3.5 3.5 0 0 1 4.95 4.95l-.35.35m-2.3-2.3a3.5 3.5 0 0 1-4.95 0l-.7-.7a3.5 3.5 0 0 1 4.95-4.95l.35.35" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>',
        alert: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L1 14h14L8 1zm0 4v4m0 2v1" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        shield: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5l-5.5 2v4c0 3.5 2.3 6.2 5.5 7.5 3.2-1.3 5.5-4 5.5-7.5v-4L8 1.5z" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>',
        trash: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 2h5M3 4h10m-1 0l-.5 8.5a1 1 0 0 1-1 .5h-5a1 1 0 0 1-1-.5L4 4" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>',
    };
    return icons[name] || '';
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
    
    const outputChannel = vscode.window.createOutputChannel('Silverfin CLI');
    const templateProvider = new TemplateProvider();
    const developmentProvider = new DevelopmentWebviewProvider(templateProvider);
    const cliInfoProvider = new CLIInfoWebviewProvider();

    vscode.window.registerTreeDataProvider('silverfin-template', templateProvider);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('silverfin-development', developmentProvider),
        vscode.window.registerWebviewViewProvider('silverfin-cli-info', cliInfoProvider)
    );

    vscode.commands.executeCommand('setContext', 'silverfin-lvlup.active', true);

    vscode.window.onDidChangeActiveTextEditor(() => {
        templateProvider.refresh();
        developmentProvider.refresh();
    });

    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('silverfinLvlUp')) {
            cliInfoProvider.refresh();
        }
    });

    const providers = { templateProvider, developmentProvider, cliInfoProvider };
    registerAllCommands(context, providers, outputChannel);
    
    console.log('Silverfin activity bar activated successfully');
    return providers;
}

/**
 * Registers all VS Code commands for the activity bar
 */
function registerAllCommands(
    context: vscode.ExtensionContext,
    providers: { templateProvider: TemplateProvider; developmentProvider: DevelopmentWebviewProvider; cliInfoProvider: CLIInfoWebviewProvider },
    outputChannel: vscode.OutputChannel
) {
    context.subscriptions.push(outputChannel);

    const commands: [string, (...args: any[]) => any][] = [
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
        ['silverfin-lvlup.createReconciliation', () => createReconciliation(outputChannel)],
        ['silverfin-lvlup.createSharedPart', () => createSharedPart(outputChannel)],

        // CLI Info commands
        ['silverfin-lvlup.refreshCLIInfo', () => providers.cliInfoProvider.refresh()],
        ['silverfin-lvlup.updateCLI', () => updateCLI(outputChannel, providers.cliInfoProvider)],
        ['silverfin-lvlup.addEnvironment', () => addEnvironment(providers.cliInfoProvider)],
        ['silverfin-lvlup.removeEnvironment', (firmId: string) => {
            if (firmId) { removeEnvironment(firmId, providers.cliInfoProvider); }
        }],
        ['silverfin-lvlup.toggleProdEnvironment', (firmId: string) => {
            if (firmId) { toggleProdEnvironment(firmId, providers.cliInfoProvider); }
        }],
        ['silverfin-lvlup.setActiveEnvironment', (firmId: string) => {
            if (firmId) { setActiveEnvironment(firmId, providers.cliInfoProvider, outputChannel); }
        }],
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
    if (!await checkProdGuard()) return;

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
    const confirm = await vscode.window.showWarningMessage(
        'Are you sure you want to update ALL reconciliations? This will push all local changes to the platform.',
        { modal: true },
        'Yes, update all'
    );
    if (confirm !== 'Yes, update all') return;

    if (!await checkProdGuard()) return;

    try {
        vscode.window.showInformationMessage('Updating all reconciliations...');
        await runSilverfinCommand('silverfin', ['update-reconciliation', '--all', '--yes'], outputChannel);
        vscode.window.showInformationMessage('Successfully updated all reconciliations');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to update reconciliations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Adds shared parts to the current template via Silverfin CLI
 */
async function addSharedPartsToTemplate(templateProvider: TemplateProvider, outputChannel: vscode.OutputChannel): Promise<void> {
    if (!await checkProdGuard()) return;

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

// ================================================================================================
// NEW COMMAND IMPLEMENTATIONS
// ================================================================================================

async function createReconciliation(outputChannel: vscode.OutputChannel): Promise<void> {
    if (!await checkProdGuard()) return;

    const handle = await vscode.window.showInputBox({
        prompt: 'Enter the handle for the new reconciliation',
        placeHolder: 'e.g., my_reconciliation'
    });
    if (!handle) return;

    const setupType = await vscode.window.showQuickPick(
        ['Simple setup', 'Full wizard'],
        { placeHolder: 'Choose setup type' }
    );
    if (!setupType) return;

    try {
        if (setupType === 'Simple setup') {
            await runSilverfinCommand('silverfin', ['create-reconciliation', '--handle', handle, '--yes'], outputChannel);
        } else {
            const nameEn = await vscode.window.showInputBox({
                prompt: 'Enter English name (leave empty to skip)',
                placeHolder: 'English template name'
            });

            const nameNl = await vscode.window.showInputBox({
                prompt: 'Enter Dutch name (leave empty to skip)',
                placeHolder: 'Dutch template name'
            });

            const nameFr = await vscode.window.showInputBox({
                prompt: 'Enter French name (leave empty to skip)',
                placeHolder: 'French template name'
            });

            const reconciliationType = await vscode.window.showQuickPick(
                ['reconciliation_not_necessary', 'can_be_reconciled_without_data', 'only_reconciled_with_data'],
                { placeHolder: 'Select reconciliation type' }
            );

            const args = ['create-reconciliation', '--handle', handle];
            if (nameEn) { args.push('--name-en', nameEn); }
            if (nameNl) { args.push('--name-nl', nameNl); }
            if (nameFr) { args.push('--name-fr', nameFr); }
            if (reconciliationType) { args.push('--reconciliation-type', reconciliationType); }
            args.push('--yes');

            await runSilverfinCommand('silverfin', args, outputChannel);
        }
        vscode.window.showInformationMessage(`Successfully created reconciliation: ${handle}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create reconciliation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function createSharedPart(outputChannel: vscode.OutputChannel): Promise<void> {
    if (!await checkProdGuard()) return;

    const name = await vscode.window.showInputBox({
        prompt: 'Enter the name for the new shared part',
        placeHolder: 'e.g., my_shared_part'
    });
    if (!name) return;

    try {
        await runSilverfinCommand('silverfin', ['create-shared-part', '--shared-part', name, '--yes'], outputChannel);
        vscode.window.showInformationMessage(`Successfully created shared part: ${name}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create shared part: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function updateCLI(outputChannel: vscode.OutputChannel, cliInfoProvider: CLIInfoWebviewProvider): Promise<void> {
    try {
        vscode.window.showInformationMessage('Updating Silverfin CLI...');
        await runSilverfinCommand('silverfin', ['update'], outputChannel);
        vscode.window.showInformationMessage('Silverfin CLI updated successfully');
        cliInfoProvider.refresh();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to update CLI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function addEnvironment(cliInfoProvider: CLIInfoWebviewProvider): Promise<void> {
    const firmId = await vscode.window.showInputBox({
        prompt: 'Enter the Firm ID (environment ID)',
        placeHolder: 'e.g., 1111'
    });
    if (!firmId) return;

    const firmName = await vscode.window.showInputBox({
        prompt: 'Enter a name for this environment',
        placeHolder: 'Silverfin Environment Name'
    });
    if (!firmName) return;

    const config = vscode.workspace.getConfiguration('silverfinLvlUp');
    const environments: SilverfinEnvironment[] = [...config.get('environments', [])];

    if (environments.some(e => e.firmId === firmId)) {
        vscode.window.showWarningMessage(`Environment with ID ${firmId} already exists.`);
        return;
    }

    environments.push({ firmId, firmName, isProd: false });
    await config.update('environments', environments, vscode.ConfigurationTarget.Global);

    const cliConfig = readCLIConfig();
    if (!cliConfig || !(firmId in cliConfig)) {
        vscode.window.showWarningMessage(
            `Environment "${firmName}" (${firmId}) added but not yet authorized in the Silverfin CLI. Run 'silverfin authorize' in the terminal to authorize it.`
        );
    } else {
        vscode.window.showInformationMessage(`Environment added: ${firmName} (${firmId})`);
    }

    cliInfoProvider.refresh();
}

async function removeEnvironment(firmId: string, cliInfoProvider: CLIInfoWebviewProvider): Promise<void> {
    const config = vscode.workspace.getConfiguration('silverfinLvlUp');
    const environments: SilverfinEnvironment[] = [...config.get('environments', [])];
    const env = environments.find(e => e.firmId === firmId);
    if (!env) return;

    const confirm = await vscode.window.showWarningMessage(
        `Remove environment "${env.firmName}" (${firmId})?`,
        'Yes', 'No'
    );
    if (confirm !== 'Yes') return;

    const filtered = environments.filter(e => e.firmId !== firmId);
    await config.update('environments', filtered, vscode.ConfigurationTarget.Global);

    const activeEnvId = config.get<string>('activeEnvironment', '');
    if (activeEnvId === firmId) {
        await config.update('activeEnvironment', '', vscode.ConfigurationTarget.Global);
    }

    cliInfoProvider.refresh();
    vscode.window.showInformationMessage(`Removed environment: ${env.firmName}`);
}

async function toggleProdEnvironment(firmId: string, cliInfoProvider: CLIInfoWebviewProvider): Promise<void> {
    const config = vscode.workspace.getConfiguration('silverfinLvlUp');
    const environments: SilverfinEnvironment[] = [...config.get('environments', [])];
    const env = environments.find(e => e.firmId === firmId);
    if (!env) return;

    env.isProd = !env.isProd;
    await config.update('environments', environments, vscode.ConfigurationTarget.Global);

    cliInfoProvider.refresh();
    vscode.window.showInformationMessage(`${env.firmName} ${env.isProd ? 'marked as PRODUCTION' : 'unmarked from production'}`);
}

async function setActiveEnvironment(firmId: string, cliInfoProvider: CLIInfoWebviewProvider, outputChannel: vscode.OutputChannel): Promise<void> {
    const extensionConfig = vscode.workspace.getConfiguration('silverfinLvlUp');
    const environments: SilverfinEnvironment[] = extensionConfig.get('environments', []);
    const env = environments.find(e => e.firmId === firmId);
    if (!env) return;

    const currentActive = extensionConfig.get<string>('activeEnvironment', '');

    if (currentActive === firmId) {
        await extensionConfig.update('activeEnvironment', '', vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Deactivated environment: ${env.firmName}`);
    } else {
        try {
            await runSilverfinCommand('silverfin', ['config', '-s', firmId], outputChannel);
            await extensionConfig.update('activeEnvironment', firmId, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Active environment set to: ${env.firmName} (${firmId})`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to set active environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    cliInfoProvider.refresh();
}

// ================================================================================================
// CLI UTILITY FUNCTIONS
// ================================================================================================

function runCommandCapture(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        let output = '';
        const proc = spawn(command, args, { shell: true });

        proc.stdout?.on('data', (data: Buffer) => { output += data.toString(); });
        proc.stderr?.on('data', (data: Buffer) => { output += data.toString(); });

        proc.on('close', () => resolve(output));
        proc.on('error', reject);

        setTimeout(() => {
            proc.kill();
            resolve(output);
        }, 10000);
    });
}

async function detectCLIVersion(): Promise<CLIVersionInfo | null> {
    try {
        const helpOutput = await runCommandCapture('silverfin', ['--help']);

        const updateMatch = helpOutput.match(/\((\d+\.\d+\.\d+)\s*->\s*(\d+\.\d+\.\d+)\)/);
        if (updateMatch) {
            return {
                currentVersion: updateMatch[1],
                latestVersion: updateMatch[2],
                updateAvailable: true
            };
        }

        const versionOutput = await runCommandCapture('silverfin', ['-V']);
        const versionMatch = versionOutput.match(/(\d+\.\d+\.\d+)/);

        if (versionMatch) {
            return {
                currentVersion: versionMatch[1],
                latestVersion: null,
                updateAvailable: false
            };
        }

        return null;
    } catch {
        return null;
    }
}

function getCLIConfigPath(): string {
    const customPath = vscode.workspace.getConfiguration('silverfinLvlUp').get<string>('cliConfigPath', '');
    if (customPath) return customPath;
    return join(homedir(), '.silverfin', 'config.json');
}

function getCLIDefaultFirmId(cliConfig: Record<string, any> | null): string | null {
    if (!cliConfig?.defaultFirmIDs) return null;
    const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name;
    if (workspaceName && cliConfig.defaultFirmIDs[workspaceName]) {
        return cliConfig.defaultFirmIDs[workspaceName];
    }
    const values = Object.values(cliConfig.defaultFirmIDs) as string[];
    return values.length > 0 ? values[0] : null;
}

function readCLIConfig(): Record<string, any> | null {
    try {
        const configPath = getCLIConfigPath();
        if (existsSync(configPath)) {
            return JSON.parse(readFileSync(configPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading CLI config:', error);
    }
    return null;
}

async function seedEnvironmentsFromConfig(): Promise<void> {
    const cliConfig = readCLIConfig();
    if (!cliConfig) return;

    const config = vscode.workspace.getConfiguration('silverfinLvlUp');
    const environments: SilverfinEnvironment[] = [...config.get('environments', [])];
    const existingIds = new Set(environments.map(e => e.firmId));

    let added = false;
    for (const [key, value] of Object.entries(cliConfig)) {
        if (key === 'defaultFirmIDs' || key === 'host') continue;
        if (existingIds.has(key) || !/^\d+$/.test(key)) continue;

        const firmData = value as any;
        environments.push({
            firmId: key,
            firmName: firmData.firmName || `Firm ${key}`,
            isProd: false
        });
        added = true;
    }

    if (added) {
        await config.update('environments', environments, vscode.ConfigurationTarget.Global);
    }
}

async function checkProdGuard(): Promise<boolean> {
    const config = vscode.workspace.getConfiguration('silverfinLvlUp');
    const activeEnvId = config.get<string>('activeEnvironment', '');
    if (!activeEnvId) return true;

    const environments: SilverfinEnvironment[] = config.get('environments', []);
    const activeEnv = environments.find(e => e.firmId === activeEnvId);
    if (!activeEnv?.isProd) return true;

    const result = await vscode.window.showWarningMessage(
        `You are about to push to a PRODUCTION environment: ${activeEnv.firmName} (${activeEnv.firmId}). Are you sure you want to continue?`,
        { modal: true },
        'Yes, proceed'
    );

    return result === 'Yes, proceed';
}
