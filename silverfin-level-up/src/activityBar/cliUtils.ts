import * as vscode from 'vscode';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { homedir } from 'os';
import { SilverfinEnvironment, CLIVersionInfo } from './helpers';

// ================================================================================================
// CLI UTILITY FUNCTIONS
// ================================================================================================

/**
 * Executes Silverfin CLI commands in the background and logs output
 */
export function runSilverfinCommand(command: string, args: string[], outputChannel: vscode.OutputChannel): Promise<void> {
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

export function runCommandCapture(command: string, args: string[]): Promise<string> {
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

export async function detectCLIVersion(): Promise<CLIVersionInfo | null> {
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

export function getCLIConfigPath(): string {
    const customPath = vscode.workspace.getConfiguration('silverfinLvlUp').get<string>('cliConfigPath', '');
    if (customPath) return customPath;
    return join(homedir(), '.silverfin', 'config.json');
}

export function getCLIDefaultFirmId(cliConfig: Record<string, any> | null): string | null {
    if (!cliConfig?.defaultFirmIDs) return null;
    const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name;
    if (workspaceName && cliConfig.defaultFirmIDs[workspaceName]) {
        return cliConfig.defaultFirmIDs[workspaceName];
    }
    const values = Object.values(cliConfig.defaultFirmIDs) as string[];
    return values.length > 0 ? values[0] : null;
}

export function readCLIConfig(): Record<string, any> | null {
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

export async function seedEnvironmentsFromConfig(): Promise<void> {
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
