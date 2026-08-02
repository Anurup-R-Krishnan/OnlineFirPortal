import { getAccessToken } from '../auth-store';

function withAuthHeaders(headers: HeadersInit = {}): HeadersInit {
    const token = getAccessToken();
    if (!token) return headers;
    return { ...headers, Authorization: `Bearer ${token}` };
}

export interface Evidence {
    id: string;
    type: string;
    description: string;
    quantity?: string;
    storageLocation: string;
    status: 'COLLECTED' | 'IN_CUSTODY' | 'IN_TRANSIT' | 'IN_LAB' | 'IN_COURT' | 'DISPOSED' | 'RETURNED';
    firId: string;
    createdAt: string;
    updatedAt: string;
    chainOfCustody?: ChainOfCustodyEntry[];
}

export interface ChainOfCustodyEntry {
    id: string;
    timestamp: string;
    evidenceId: string;
    handlerId: string;
    receiverId?: string;
    action: string;
    purpose?: string;
    location?: string;
    handler: {
        name: string;
        badgeNumber?: string;
    };
    receiver?: {
        name: string;
        badgeNumber?: string;
    };
}

export const evidenceApi = {
    create: async (data: {
        firId: string;
        type: string;
        description: string;
        quantity?: string;
        storageLocation: string;
    }) => {
        const res = await fetch('/api/evidence', {
            method: 'POST',
            headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create evidence');
        return await res.json();
    },

    getByFir: async (firId: string): Promise<Evidence[]> => {
        const res = await fetch(`/api/evidence/fir/${firId}`, {
            headers: withAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch evidence');
        return await res.json();
    },

    transfer: async (
        id: string,
        data: {
            action: string;
            receiverId?: string;
            purpose?: string;
            location?: string;
            newStatus?: string;
        }
    ) => {
        const res = await fetch(`/api/evidence/${id}/transfer`, {
            method: 'POST',
            headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to transfer evidence');
        return await res.json();
    },

    getChainOfCustody: async (id: string): Promise<ChainOfCustodyEntry[]> => {
        const res = await fetch(`/api/evidence/${id}/chain-of-custody`, {
            headers: withAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch chain of custody');
        return await res.json();
    },
};
