export declare function cleanDatabase(): Promise<void>;
export declare const TEST_DB_PATH: string;
export declare function ensureCleanTestDb(): void;
export declare function uniqueEmail(prefix: string): string;
export declare function startTestServer(): Promise<{
    baseUrl: string;
    stop: typeof stopTestServer;
}>;
export declare function stopTestServer(): Promise<void>;
export declare function waitForLog(pattern: RegExp, timeoutMs?: number): Promise<void>;
export declare function waitForOtp(email: string, timeoutMs?: number): Promise<string>;
//# sourceMappingURL=utils.d.ts.map