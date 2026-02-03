export declare function createFIR(payload: Record<string, any>): any;
export declare function getAllFIRs(): any;
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
export declare function createUser(user: any): any;
export declare function getUserByEmail(email: string): any;
export declare function getUserByIdentifier(identifier: string): any;
export declare function getUserById(id: string): any;
//# sourceMappingURL=db.d.ts.map