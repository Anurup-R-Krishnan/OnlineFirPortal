import { getAccessToken } from './auth-store';

export type FIRStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_INVESTIGATION' | 'CLOSED' | 'REJECTED';

export interface FIR {
    id: string;
    referenceNumber: string;
    title: string;
    crimeType: string;
    description: string;
    incidentDate: string;
    incidentTime: string;
    incidentPlace: string;
    incidentState?: string;
    incidentDistrict?: string;
    nearestLandmark?: string;
    status: FIRStatus;
    priority: string;

    reporterId: string;
    reporter?: {
        id: string;
        name: string;
        email: string;
        mobile: string;
    };

    assignedOfficerId?: string;
    assignedStation?: string;
    assignedOfficer?: {
        id: string;
        name: string;
        badgeNumber: string;
        rank?: string;
    };

    ipcSections?: string;
    hasWitness: boolean;
    witnessDetails?: string;
    suspectDetails?: string;

    documents: Array<any>; // Update based on document handling

    signature?: string;
    signedAt?: string;
    submittedAt?: string;
    closedAt?: string;

    createdAt: string;
    updatedAt: string;

    timeline: Array<{
        id: string;
        action: string;
        details?: string;
        actorName: string;
        actor?: {
            name: string;
            role: string;
        };
        createdAt: string;
    }>;
}

function withAuthHeaders(headers: HeadersInit = {}): HeadersInit {
    const token = getAccessToken();
    if (!token) return headers;
    return { ...headers, Authorization: `Bearer ${token}` };
}

export async function createFIR(data: {
    complaintType: string;
    incidentDate: string;
    incidentTime: string;
    incidentDescription: string;
    incidentState: string;
    incidentDistrict: string;
    incidentPlace: string;
    nearestLandmark?: string;
    hasWitness?: boolean;
    witnessDetails?: string;
    suspectDetails?: string;
    ipcSections?: string;
}): Promise<FIR> {
    const res = await fetch('/api/firs', {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error('Failed to create FIR');
    }

    return await res.json();
}

export async function submitFIR(id: string, firData?: any): Promise<void> {
    let signature: string | undefined;

    let signatureData: string | undefined;

    // Generate digital signature if we have the FIR data
    if (firData) {
        try {
            const { getOrGenerateKeyPair, signData } = await import('./digital-signature');
            const keys = await getOrGenerateKeyPair();
            // Sign canonical fields matching backend verification
            const canonicalPayload = {
                reporterId: firData.reporterId,
                complaintType: firData.crimeType || firData.complaintType,
                incidentDate: firData.incidentDate,
                incidentPlace: firData.incidentPlace,
                description: firData.description,
            };
            signatureData = JSON.stringify(canonicalPayload);
            signature = await signData(signatureData, keys.privateKey);
        } catch (error) {
            console.error('Failed to generate signature:', error);
            // Continue without signature - backend will handle it
        }
    }

    const res = await fetch(`/api/firs/${id}/submit`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ signature, signatureData }),
    });

    if (!res.ok) {
        throw new Error('Failed to submit FIR');
    }
}


export async function getFIRById(id: string): Promise<FIR | null> {
    const fetchByInternalId = async (internalId: string): Promise<FIR | null> => {
        const res = await fetch(`/api/firs/${internalId}`, {
            headers: withAuthHeaders()
        });

        if (res.ok) {
            return await res.json();
        }

        if (res.status === 404) {
            return null;
        }

        if (res.status === 401) {
            throw new Error('AUTH_REQUIRED');
        }

        if (res.status === 403) {
            throw new Error('FORBIDDEN');
        }

        const errorBody = await res.json().catch(() => ({} as any));
        throw new Error(errorBody?.error || `Failed to fetch FIR (${res.status})`);
    };

    const direct = await fetchByInternalId(id);
    if (direct) {
        return direct;
    }

    // Support reference-number based lookup used by tracking UI.
    if (/^FIR/i.test(id)) {
        const { firs } = await getAllFIRs({ limit: 100 });
        const match = firs.find((fir) => fir.referenceNumber?.toLowerCase() === id.toLowerCase());
        if (!match?.id) {
            return null;
        }
        return await fetchByInternalId(match.id);
    }

    return null;
}

export async function getAllFIRs(filters?: { status?: string; page?: number; limit?: number }): Promise<{ firs: FIR[], total: number, pages: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const res = await fetch(`/api/firs?${params}`, {
        headers: withAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch FIRs');
    return await res.json();
}

export async function updateFIRStatus(
    firId: string,
    status: FIRStatus,
    remarks?: string
): Promise<void> {
    const res = await fetch(`/api/firs/${firId}/update-status`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status, remarks }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err?.error || `Failed to update FIR status (${res.status})`);
    }
}

export async function assignOfficer(
    firId: string,
    officerId: string,
    station: string
): Promise<void> {
    const res = await fetch(`/api/firs/${firId}/assign`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            officerId,
            station
        }),
    });
    if (!res.ok) throw new Error('Failed to assign officer');
}


export async function addInvestigationNote(firId: string, note: string): Promise<void> {
    const res = await fetch(`/api/firs/${firId}/notes`, {
        method: 'POST',
        headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ note }),
    });
    if (!res.ok) throw new Error('Failed to add investigation note');
}

export async function getFIRStats(): Promise<{ total: number; pending: number; assigned: number; investigation: number; closed: number }> {
    const res = await fetch('/api/firs/stats', {
        headers: withAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch FIR stats');
    return await res.json();
}

export interface AssignableOfficer {
    id: string;
    name: string;
    role: 'OFFICER' | 'SHO';
    policeStation?: string;
    badgeNumber?: string;
    rank?: string;
    email: string;
    mobile: string;
}

export async function getAssignableOfficers(): Promise<AssignableOfficer[]> {
    const res = await fetch('/api/firs/officers', {
        headers: withAuthHeaders()
    });
    if (res.status === 403) return [];
    if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error(err?.error || `Failed to fetch assignable officers (${res.status})`);
    }
    const data = await res.json();
    return data.officers || [];
}

export async function getFIRsByUser(userId: string): Promise<FIR[]> {
    // Reusing getAllFIRs as it filters by user context automatically on backend
    const { firs } = await getAllFIRs({ limit: 100 });
    return firs;
}
