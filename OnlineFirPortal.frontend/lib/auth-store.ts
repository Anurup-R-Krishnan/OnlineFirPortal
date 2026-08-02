import { type UserRole } from './security';
import { useState, useEffect } from 'react';

export interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    aadhaar?: string;
    role: UserRole;
    policeStation?: string;
    badgeNumber?: string;
    rank?: string;
    mfaEnabled: boolean;
    accountStatus: 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    mfaRequired: boolean;
    mfaVerified: boolean;
    user: User | null;
    accessToken?: string;
    tempToken?: string; // For MFA verification
    recoveryCodes?: string[]; // Stored temporarily during setup
}

const STORAGE_KEY = 'online_fir_auth_state';
const AUTH_STATE_EVENT = 'auth-state-changed';

// Initialize state from storage if available
let currentState: AuthState = {
    isAuthenticated: false,
    mfaRequired: false,
    mfaVerified: false,
    user: null,
};

if (typeof window !== 'undefined') {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            currentState = JSON.parse(stored);
        }
    } catch {
        currentState = {
            isAuthenticated: false,
            mfaRequired: false,
            mfaVerified: false,
            user: null,
        };
    }
}

export function getAuthState(): AuthState {
    return currentState;
}

export function getAccessToken(): string | null {
    return currentState.accessToken ?? null;
}

export function getTempToken(): string | null {
    return currentState.tempToken ?? null;
}

export function setMfaRequired(tempToken: string) {
    currentState = {
        ...currentState,
        isAuthenticated: false,
        mfaRequired: true,
        mfaVerified: false,
        tempToken,
    };
    saveState();
}

export function completeLogin(user: User, accessToken: string) {
    currentState = {
        isAuthenticated: true,
        mfaRequired: false,
        mfaVerified: true,
        user,
        accessToken,
        tempToken: undefined,
        recoveryCodes: undefined,
    };
    saveState();
}

export function setRecoveryCodes(codes: string[]) {
    currentState = {
        ...currentState,
        recoveryCodes: codes,
    };
    saveState();
}

export function setAuthState(state: AuthState) {
    currentState = state;
    saveState();
}

export async function login(email: string, password: string) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data?.error || 'Login failed' };
        }

        const requiresMfa = data?.mfaRequired ?? data?.requiresMfa ?? false;
        if (requiresMfa && data?.tempToken) {
            setMfaRequired(data.tempToken);
            return {
                success: true,
                mfaRequired: true,
                tempToken: data.tempToken,
            };
        }

        if (data?.accessToken && data?.user) {
            completeLogin(data.user, data.accessToken);
            return { success: true, mfaRequired: false, accessToken: data.accessToken, user: data.user };
        }

        return { success: true, ...data };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
}

export function logout() {
    currentState = {
        isAuthenticated: false,
        mfaRequired: false,
        mfaVerified: false,
        user: null,
        accessToken: undefined,
        tempToken: undefined,
        recoveryCodes: undefined,
    };
    saveState();

    if (typeof window !== 'undefined') {
        localStorage.removeItem('digitalSignatureKeys');
    }

    // Call API to clear cookies
    if (typeof fetch === 'function') {
        Promise.resolve(fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }))
            .catch(() => { });
    }
}

function saveState() {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
        window.dispatchEvent(new Event(AUTH_STATE_EVENT));
    }
}

export function useAuth() {
    const [state, setState] = useState(getAuthState());

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateState = () => {
            const newState = getAuthState();
            setState((prev) => (JSON.stringify(prev) === JSON.stringify(newState) ? prev : newState));
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key === STORAGE_KEY) {
                updateState();
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener(AUTH_STATE_EVENT, updateState);
        updateState();

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener(AUTH_STATE_EVENT, updateState);
        };
    }, []);

    return {
        ...state,
        token: state.accessToken,
        login: completeLogin,
        logout
    };
}
