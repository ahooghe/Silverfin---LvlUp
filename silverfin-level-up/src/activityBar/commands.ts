import * as vscode from 'vscode';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { TemplateType, TextParts, SilverfinEnvironment } from './helpers';
import { TemplateProvider, CLIInfoWebviewProvider } from './providers';
import { runSilverfinCommand, readCLIConfig } from './cliUtils';

// ================================================================================================
// COMMAND IMPLEMENTATIONS
// ================================================================================================

/**
 * Opens the config.json file in the editor
 */
export async function openConfigFile(templateProvider: TemplateProvider): Promise<void> {
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
export async function toggleConfigValue(templateProvider: TemplateProvider, fieldName: string, currentValue: boolean): Promise<void> {
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
export async function changeReconciliationType(templateProvider: TemplateProvider, fieldName: string, currentValue: string): Promise<void> {
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
export async function editConfigValue(templateProvider: TemplateProvider, fieldName: string, currentValue: any): Promise<void> {
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
export async function syncTemplate(templateProvider: TemplateProvider, outputChannel: vscode.OutputChannel): Promise<void> {
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
export async function updateAllReconciliations(outputChannel: vscode.OutputChannel): Promise<void> {
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
export async function addSharedPartsToTemplate(templateProvider: TemplateProvider, outputChannel: vscode.OutputChannel): Promise<void> {
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
export async function addTextPartsToConfig(templateProvider: TemplateProvider): Promise<void> {
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

export async function createReconciliation(outputChannel: vscode.OutputChannel): Promise<void> {
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

export async function createSharedPart(outputChannel: vscode.OutputChannel): Promise<void> {
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

export async function updateCLI(outputChannel: vscode.OutputChannel, cliInfoProvider: CLIInfoWebviewProvider): Promise<void> {
    try {
        vscode.window.showInformationMessage('Updating Silverfin CLI...');
        await runSilverfinCommand('silverfin', ['update'], outputChannel);
        vscode.window.showInformationMessage('Silverfin CLI updated successfully');
        cliInfoProvider.refresh();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to update CLI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function addEnvironment(cliInfoProvider: CLIInfoWebviewProvider): Promise<void> {
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

export async function removeEnvironment(firmId: string, cliInfoProvider: CLIInfoWebviewProvider): Promise<void> {
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

export async function toggleProdEnvironment(firmId: string, cliInfoProvider: CLIInfoWebviewProvider): Promise<void> {
    const config = vscode.workspace.getConfiguration('silverfinLvlUp');
    const environments: SilverfinEnvironment[] = [...config.get('environments', [])];
    const env = environments.find(e => e.firmId === firmId);
    if (!env) return;

    env.isProd = !env.isProd;
    await config.update('environments', environments, vscode.ConfigurationTarget.Global);

    cliInfoProvider.refresh();
    vscode.window.showInformationMessage(`${env.firmName} ${env.isProd ? 'marked as PRODUCTION' : 'unmarked from production'}`);
}

export async function setActiveEnvironment(firmId: string, cliInfoProvider: CLIInfoWebviewProvider, outputChannel: vscode.OutputChannel): Promise<void> {
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
// PRODUCTION GUARD
// ================================================================================================

export async function checkProdGuard(): Promise<boolean> {
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

// ================================================================================================
// TEMPLATE FILE EXTRACTION UTILITIES
// ================================================================================================

/**
 * Extracts shared part handles from liquid template files
 */
export function extractSharedPartHandles(templateProvider: TemplateProvider): string[] {
    return extractFromTemplateFiles(templateProvider, /{%\s*include\s+["']shared\/([^"']+)["']\s*%}/g);
}

/**
 * Extracts text parts from liquid template files
 */
export function extractTextParts(templateProvider: TemplateProvider): TextParts {
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
export function extractFromTemplateFiles(templateProvider: TemplateProvider, regex: RegExp): string[] {
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
export function getFilesToParse(configData: any, templateDir: string): string[] {
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
