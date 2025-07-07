declare module 'tcp-port-used' {
    export function check(port: number, host?: string): Promise<boolean>;
    export function waitUntilFree(port: number, retryTimeMs?: number, timeOutMs?: number): Promise<void>;
    export function waitUntilUsed(port: number, retryTimeMs?: number, timeOutMs?: number): Promise<void>;
    export function waitUntilFreeOnHost(port: number, host: string, retryTimeMs?: number, timeOutMs?: number): Promise<void>;
    export function waitUntilUsedOnHost(port: number, host: string, retryTimeMs?: number, timeOutMs?: number): Promise<void>;
}

export interface PortEmojiConfig {
    prefix?: string;
    replace?: string;
    suffix?: string;
}

export interface PortMonitorConfig {
    hosts: Record<string, (string | number)[] | Record<string, (string | number)[]>>;
    portLabels: Record<string, string>;
    portEmojis?: Record<string, string | PortEmojiConfig>;
    emojiMode?: 'prefix' | 'replace' | 'suffix';
    statusIcons: { inUse: string; free: string };
    intervalMs: number;
    enableProcessKill: boolean;
    confirmBeforeKill: boolean;
    enableLogViewer: boolean;
    logBufferSize: number;
    autoScrollLog: boolean;
    displayOptions: {
        separator: string;
        showFullPortNumber: boolean;
        compactRanges: boolean;
    };
}

export interface HostPortConfig {
    host: string;
    category?: string;
    ports: number[];
}
