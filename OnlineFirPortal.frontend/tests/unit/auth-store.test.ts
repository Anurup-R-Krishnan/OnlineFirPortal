import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getAuthState, login, logout, setAuthState } from '../../lib/auth-store';

// Mock fetch
global.fetch = vi.fn();

describe('Auth Store', () => {
    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        // Reset fetch mock
        vi.clearAllMocks();
    });

    describe('getAuthState', () => {
        it('should return initial unauthenticated state', () => {
            const state = getAuthState();

            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBeNull();
            expect(state.mfaRequired).toBe(false);
        });
    });

    describe('login', () => {
        it('should handle successful login with MFA required', async () => {
            const mockResponse = {
                tempToken: 'temp_token_123',
                mfaRequired: true,
                user: {
                    id: '1',
                    email: 'test@example.com',
                    name: 'Test User',
                    role: 'CITIZEN'
                }
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await login('test@example.com', 'password123');

            expect(result.success).toBe(true);
            expect(result.mfaRequired).toBe(true);
            expect(result.tempToken).toBe('temp_token_123');
        });

        it('should handle login failure', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Invalid credentials' })
            });

            const result = await login('test@example.com', 'wrongpassword');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid');
        });
    });

    describe('logout', () => {
        it('should clear auth state', () => {
            // Set authenticated state
            setAuthState({
                isAuthenticated: true,
                mfaRequired: false,
                mfaVerified: true,
                user: {
                    id: '1',
                    email: 'test@example.com',
                    name: 'Test User',
                    role: 'CITIZEN',
                    mobile: '1234567890',
                    mfaEnabled: true,
                    accountStatus: 'ACTIVE',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                accessToken: 'token_123'
            });

            logout();

            const state = getAuthState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBeNull();
            expect(state.accessToken).toBeUndefined();
        });

        it('should clear digital signature keys on logout', () => {
            // Set keys in localStorage
            localStorage.setItem('digitalSignatureKeys', JSON.stringify({
                publicKey: 'pub_key',
                privateKey: 'priv_key'
            }));

            logout();

            const keys = localStorage.getItem('digitalSignatureKeys');
            expect(keys).toBeNull();
        });
    });
});
