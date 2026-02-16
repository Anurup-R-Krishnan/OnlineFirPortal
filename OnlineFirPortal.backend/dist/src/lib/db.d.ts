export declare function createFIR(payload: Record<string, any>): any;
export declare function getAllFIRs(): any;
export type FIRStats = {
    total: number;
    pending: number;
    assigned: number;
    investigation: number;
    chargesheet: number;
    closed: number;
    rejected: number;
};
export declare function getFIRStats(): FIRStats;
export declare function getFIRById(id: string): any;
export declare function updateFIRStatus(id: string, status: string, actor?: string, details?: string): any;
export declare function assignOfficer(id: string, officerId: string, officerName: string, policeStation: string, actor?: string): any;
export declare function addTimelineEntry(firId: string, entry: {
    timestamp?: string;
    actor?: string;
    action: string;
    details?: string;
}): any;
export declare function addDocument(firId: string, doc: {
    filename: string;
    mimetype?: string;
    size?: number;
    content?: string;
}): any;
export declare function registerUserPublicKey(userId: string, publicKey: string, label?: string): any;
export declare function getUserPublicKeys(userId: string): any;
export declare function isUserPublicKeyRegistered(userId: string, publicKey: string): boolean;
export declare function decryptDocumentContent(content: string): string;
export declare function createUser(user: any): any;
export declare function getUserByEmail(email: string): any;
export declare function getUserByIdentifier(identifier: string): any;
export declare function getUserById(id: string): any;
export declare function listUsers(): any;
export declare function deleteFIR(firId: string): boolean;
export declare function listDocuments(): any;
export declare function deleteDocument(documentId: string): boolean;
export declare function deleteUser(userId: string): boolean;
export declare function getReportSummary(): {
    firs: FIRStats;
    users: Record<string, number>;
    documents: {
        total: number;
    };
};
export declare function getSettings(): Record<string, any>;
export declare function updateSettings(next: Record<string, any>): Record<string, any>;
//# sourceMappingURL=db.d.ts.map