/**
 * Digital Signature Utilities
 * RSA-PSS signature generation and verification for FIR submissions
 */

export interface KeyPair {
    publicKey: string; // Base64 encoded SPKI
    privateKey: string; // Base64 encoded PKCS8
}

/**
 * Generate RSA-PSS key pair for digital signatures
 */
export async function generateKeyPair(): Promise<KeyPair> {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'RSA-PSS',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
    );

    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
        publicKey: bufferToBase64(publicKeyBuffer),
        privateKey: bufferToBase64(privateKeyBuffer),
    };
}

/**
 * Sign data with private key
 */
export async function signData(data: string, privateKeyBase64: string): Promise<string> {
    const encoder = new TextEncoder();
    const privateKeyBuffer = base64ToBuffer(privateKeyBase64);

    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        { name: 'RSA-PSS', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        { name: 'RSA-PSS', saltLength: 32 },
        privateKey,
        encoder.encode(data)
    );

    return bufferToBase64(signature);
}

/**
 * Verify signature with public key (client-side verification)
 */
export async function verifySignature(
    data: string,
    signatureBase64: string,
    publicKeyBase64: string
): Promise<boolean> {
    try {
        const encoder = new TextEncoder();
        const publicKeyBuffer = base64ToBuffer(publicKeyBase64);
        const signatureBuffer = base64ToBuffer(signatureBase64);

        const publicKey = await crypto.subtle.importKey(
            'spki',
            publicKeyBuffer,
            { name: 'RSA-PSS', hash: 'SHA-256' },
            false,
            ['verify']
        );

        return await crypto.subtle.verify(
            { name: 'RSA-PSS', saltLength: 32 },
            publicKey,
            signatureBuffer,
            encoder.encode(data)
        );
    } catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
}

/**
 * Register public key with backend
 */
export async function registerPublicKey(publicKey: string): Promise<boolean> {
    try {
        // Get auth token from the auth store (matches auth-store.ts STORAGE_KEY)
        let accessToken = '';
        const stored = localStorage.getItem('online_fir_auth_state');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                accessToken = parsed.accessToken || '';
            } catch { /* ignore */ }
        }

        const res = await fetch('/api/auth/register-public-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            credentials: 'include',
            body: JSON.stringify({ publicKey }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to register public key');
        }

        return true;
    } catch (error) {
        console.error('Public key registration failed:', error);
        return false;
    }
}

/**
 * Get or generate key pair (stored in localStorage)
 */
export async function getOrGenerateKeyPair(): Promise<KeyPair> {
    const stored = localStorage.getItem('digitalSignatureKeys');

    if (stored) {
        try {
            return JSON.parse(stored) as KeyPair;
        } catch (error) {
            console.warn('Failed to parse stored keys, generating new ones');
        }
    }

    // Generate new key pair
    const keyPair = await generateKeyPair();
    localStorage.setItem('digitalSignatureKeys', JSON.stringify(keyPair));

    // Register public key with backend
    await registerPublicKey(keyPair.publicKey);

    return keyPair;
}

/**
 * Clear stored keys (logout/reset)
 */
export function clearStoredKeys(): void {
    localStorage.removeItem('digitalSignatureKeys');
}

// Helper functions
function bufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64: string): Uint8Array<ArrayBuffer> {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    // Return the TypedArray, not its .buffer: crypto.subtle.importKey and
    // verify identify TypedArrays by internal slot, which works across realms
    // and across Node versions (a raw ArrayBuffer is rejected by Node 20).
    return bytes;
}
