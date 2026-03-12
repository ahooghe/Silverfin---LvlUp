import * as vscode from 'vscode';
import { TemplateProvider, DevelopmentWebviewProvider, CLIInfoWebviewProvider } from './providers';
import {
    openConfigFile, toggleConfigValue, changeReconciliationType, editConfigValue,
    syncTemplate, updateAllReconciliations, addSharedPartsToTemplate, addTextPartsToConfig,
    createReconciliation, createSharedPart, updateCLI,
    addEnvironment, removeEnvironment, toggleProdEnvironment, setActiveEnvironment,
    runTests
} from './commands';

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
        ['silverfin-lvlup.runTests', () => runTests(providers.templateProvider, outputChannel)],

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
