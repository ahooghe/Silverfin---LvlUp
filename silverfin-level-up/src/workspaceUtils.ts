import * as path from 'path';

export const SHARED_INCLUDE_PATTERN = /\{%-?\s*include\s+["']shared\/([^"']+)["']/g;

export function findTemplateRoot(filePath: string): string {
    let dir = path.dirname(filePath);
    if (path.basename(dir) === 'text_parts') {
        dir = path.dirname(dir);
    }
    return dir;
}

export function isInSharedPart(filePath: string): boolean {
    return filePath.replace(/\\/g, '/').includes('/shared_parts/');
}

export function getSharedPartHandle(filePath: string): string | null {
    const normalized = filePath.replace(/\\/g, '/');
    const match = normalized.match(/\/shared_parts\/([^/]+)\//);
    return match ? match[1] : null;
}

export function findSharedPartRoot(filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/');
    const idx = normalized.indexOf('/shared_parts/');
    if (idx === -1) { return path.dirname(filePath); }
    const afterShared = normalized.substring(idx + '/shared_parts/'.length);
    const handle = afterShared.split('/')[0];
    return normalized.substring(0, idx) + '/shared_parts/' + handle;
}

export function extractIncludedSharedParts(text: string): string[] {
    const handles: string[] = [];
    let match;
    SHARED_INCLUDE_PATTERN.lastIndex = 0;
    while ((match = SHARED_INCLUDE_PATTERN.exec(text)) !== null) {
        if (!handles.includes(match[1])) { handles.push(match[1]); }
    }
    return handles;
}