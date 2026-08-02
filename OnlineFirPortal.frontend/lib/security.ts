/**
 * Security Utilities for Online FIR Portal (Frontend)
 */

export type UserRole = 'CITIZEN' | 'OFFICER' | 'SHO' | 'ADMIN' | 'SUPER_ADMIN';

// ============ ENCODING & DECODING (Base64) ============

export function encodeBase64(data: string): string {
    return btoa(unescape(encodeURIComponent(data)));
}

export function decodeBase64(encoded: string): string {
    return decodeURIComponent(escape(atob(encoded)));
}

// ============ RSA KEY GENERATION & DIGITAL SIGNATURES ============

export async function generateRSASigningKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: 'RSA-PSS',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
        },
        true,
        ['sign', 'verify']
    );

    const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
        publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
        privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey)))
    };
}

export async function signData(data: string, privateKeyBase64: string): Promise<string> {
    const encoder = new TextEncoder();
    const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));

    const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        { name: 'RSA-PSS', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await window.crypto.subtle.sign(
        { name: 'RSA-PSS', saltLength: 32 },
        privateKey,
        encoder.encode(data)
    );

    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
