// ================================================================================================
// INTERFACES AND TYPES
// ================================================================================================

export type TemplateType = 'reconciliation' | 'shared_part' | null;

export interface TextParts {
    [key: string]: string;
}

export interface SilverfinEnvironment {
    firmId: string;
    firmName: string;
    isProd: boolean;
}

export interface CLIVersionInfo {
    currentVersion: string;
    latestVersion: string | null;
    updateAvailable: boolean;
}

// ================================================================================================
// WEBVIEW HELPERS
// ================================================================================================

export function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function getSharedCSS(): string {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { padding: 12px; font-family: var(--vscode-font-family); font-size: 12px; color: var(--vscode-foreground); background: transparent; }
    `;
}

export function getIconSvg(name: string): string {
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
