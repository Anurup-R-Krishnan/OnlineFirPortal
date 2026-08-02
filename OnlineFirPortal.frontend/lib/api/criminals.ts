import { getAccessToken } from '../auth-store';

function withAuthHeaders(headers: HeadersInit = {}): HeadersInit {
    const token = getAccessToken();
    if (!token) return headers;
    return { ...headers, Authorization: `Bearer ${token}` };
}

export interface Criminal {
    id: string;
    name: string;
    aliases?: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    height?: string;
    weight?: string;
    complexion?: string;
    eyeColor?: string;
    hairColor?: string;
    identifyingMarks?: string;
    address?: string;
    mobile?: string;
    status: string;
    mugshotUrl?: string;
    firs?: CriminalFir[];
}

export type CreateCriminalInput = Omit<Criminal, 'id' | 'status' | 'firs'> & { status?: string };

export interface CriminalFir {
    involvementType: string;
    status?: string;
    description?: string;
    fir: {
        referenceNumber: string;
        crimeType: string;
    };
}

export const criminalsApi = {
    search: async (query: string): Promise<Criminal[]> => {
        const res = await fetch(`/api/criminals?query=${encodeURIComponent(query)}`, {
            headers: withAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to search criminals');
        return await res.json();
    },

    create: async (data: CreateCriminalInput): Promise<Criminal> => {
        const res = await fetch('/api/criminals', {
            method: 'POST',
            headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create criminal profile');
        return await res.json();
    },

    linkToFir: async (id: string, data: { firId: string; involvementType: string; description?: string; status?: string }) => {
        const res = await fetch(`/api/criminals/${id}/link-fir`, {
            method: 'POST',
            headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to link criminal to FIR');
        return await res.json();
    },
};
