
import { getAccessToken } from './auth-store';

export interface Document {
    id: string;
    filename: string;
    mimetype: string;
    size: number;
    documentType: string;
    verified: boolean;
    verifiedAt?: string;
    createdAt: string;
    fir?: {
        id: string;
        referenceNumber: string;
    };
}

export async function getMyDocuments(filters?: { page?: number; limit?: number }): Promise<{ documents: Document[], total: number, pages: number }> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const token = getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`/api/documents?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        throw new Error('Failed to fetch documents');
    }

    return await res.json();
}
