/**
 * Form Validation Utilities
 * Real-time validation with contextual error messages
 */

import { z } from 'zod';

// Aadhaar validation (12 digits + Verhoeff algorithm)
export function validateAadhaar(aadhaar: string): { valid: boolean; error?: string } {
    if (!aadhaar) {
        return { valid: false, error: 'Aadhaar number is required' };
    }

    if (!/^\d{12}$/.test(aadhaar)) {
        return { valid: false, error: 'Aadhaar must be exactly 12 digits' };
    }

    // Basic format validation (real Verhoeff algorithm would be more complex)
    return { valid: true };
}

// Indian mobile number validation
export function validateMobile(mobile: string): { valid: boolean; error?: string } {
    if (!mobile) {
        return { valid: false, error: 'Mobile number is required' };
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
        return { valid: false, error: 'Enter a valid 10-digit Indian mobile number starting with 6-9' };
    }

    return { valid: true };
}

// Email validation with common typo detection
export function validateEmail(email: string): { valid: boolean; error?: string; suggestion?: string } {
    if (!email) {
        return { valid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Enter a valid email address' };
    }

    // Common typo detection
    const commonTypos: Record<string, string> = {
        'gmial.com': 'gmail.com',
        'gmai.com': 'gmail.com',
        'yahooo.com': 'yahoo.com',
        'hotmial.com': 'hotmail.com',
    };

    const domain = email.split('@')[1];
    if (domain && commonTypos[domain]) {
        return {
            valid: true,
            suggestion: `Did you mean ${email.replace(domain, commonTypos[domain])}?`,
        };
    }

    return { valid: true };
}

// Password strength validation
export function validatePassword(password: string): {
    valid: boolean;
    error?: string;
    strength: 'weak' | 'medium' | 'strong';
    suggestions: string[];
} {
    const suggestions: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (!password) {
        return { valid: false, error: 'Password is required', strength: 'weak', suggestions };
    }

    if (password.length < 8) {
        suggestions.push('Use at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
        suggestions.push('Add uppercase letters');
    }

    if (!/[a-z]/.test(password)) {
        suggestions.push('Add lowercase letters');
    }

    if (!/[0-9]/.test(password)) {
        suggestions.push('Add numbers');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        suggestions.push('Add special characters');
    }

    // Calculate strength
    if (suggestions.length === 0) {
        strength = 'strong';
    } else if (suggestions.length <= 2) {
        strength = 'medium';
    }

    const valid = suggestions.length === 0;
    const error = valid ? undefined : 'Password does not meet requirements';

    return { valid, error, strength, suggestions };
}

// FIR form validation schema
export const firFormSchema = z.object({
    // Personal details
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    mobile: z.string().refine((val) => validateMobile(val).valid, {
        message: 'Enter a valid 10-digit mobile number',
    }),
    email: z.string().email('Enter a valid email address'),
    aadhaar: z.string().refine((val) => validateAadhaar(val).valid, {
        message: 'Enter a valid 12-digit Aadhaar number',
    }),
    address: z.string().min(10, 'Address must be at least 10 characters'),

    // Incident details
    complaintType: z.string().min(1, 'Select a complaint type'),
    incidentDate: z.string().min(1, 'Incident date is required'),
    incidentTime: z.string().min(1, 'Incident time is required'),
    description: z.string().min(50, 'Description must be at least 50 characters'),

    // Location
    state: z.string().min(1, 'Select a state'),
    district: z.string().min(1, 'District is required'),
    incidentPlace: z.string().min(3, 'Incident place is required'),
    nearestLandmark: z.string().optional(),

    // Witness (conditional)
    hasWitness: z.enum(['yes', 'no']),
    witnessName: z.string().optional(),
    witnessContact: z.string().optional(),

    // Declaration
    declaration: z.boolean().refine((val) => val === true, {
        message: 'You must accept the declaration',
    }),
}).refine(
    (data) => {
        // Cross-field validation: if hasWitness is yes, require witness details
        if (data.hasWitness === 'yes') {
            return data.witnessName && data.witnessName.length > 0;
        }
        return true;
    },
    {
        message: 'Witness name is required when witness is present',
        path: ['witnessName'],
    }
);

export type FIRFormData = z.infer<typeof firFormSchema>;
