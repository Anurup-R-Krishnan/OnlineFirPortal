import { getAccessToken } from '../auth-store';

function withAuthHeaders(headers: HeadersInit = {}): HeadersInit {
    const token = getAccessToken();
    if (!token) return headers;
    return { ...headers, Authorization: `Bearer ${token}` };
}

export interface DutyShift {
    id: string;
    officerId: string;
    startTime: string;
    endTime?: string;
    type: 'MORNING' | 'EVENING' | 'NIGHT' | 'GENERAL';
    status: 'ON_DUTY' | 'OFF_DUTY' | 'ON_LEAVE' | 'SICK_LEAVE' | 'TRAINING' | 'COURT_DUTY' | 'PATROL' | 'BREAK';
    activities?: string;
    location?: string;
    officer: {
        id: string;
        name: string;
        badgeNumber?: string;
        rank?: string;
        policeStation?: string;
        mobile?: string;
    };
}

export const rosterApi = {
    getRoster: async (date?: Date, station?: string): Promise<DutyShift[]> => {
        let url = '/api/roster?';
        if (date) url += `date=${date.toISOString()}&`;
        if (station) url += `station=${encodeURIComponent(station)}`;

        const res = await fetch(url, {
            headers: withAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch roster');
        return await res.json();
    },

    assignShift: async (data: {
        officerId: string;
        startTime: string;
        endTime?: string;
        type: string;
        status?: string;
        activities?: string;
        location?: string;
    }) => {
        const res = await fetch('/api/roster/shift', {
            method: 'POST',
            headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to assign shift');
        return await res.json();
    },

    updateStatus: async (data: { status: string; location?: string; activities?: string }) => {
        const res = await fetch('/api/roster/status', {
            method: 'POST',
            headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update status');
        return await res.json();
    },
};
