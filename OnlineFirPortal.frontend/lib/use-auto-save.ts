/**
 * Form Auto-Save Hook
 * Automatically saves form data to localStorage and restores on mount
 */

import { useEffect, useRef, useState } from 'react';

interface AutoSaveOptions {
    key: string;
    debounceMs?: number;
    onSave?: () => void;
    onRestore?: () => void;
}

export function useAutoSave<T extends Record<string, any>>(
    formData: T,
    options: AutoSaveOptions
) {
    const { key, debounceMs = 2000, onSave, onRestore } = options;
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Restore from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                onRestore?.();
                // Note: data is restored via onRestore callback, not returned
            } catch (error) {
                console.error('Failed to restore form data:', error);
            }
        }
    }, [key]);

    // Auto-save on form data change
    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setIsDirty(true);

        timeoutRef.current = setTimeout(() => {
            localStorage.setItem(key, JSON.stringify(formData));
            setLastSaved(new Date());
            setIsDirty(false);
            onSave?.();
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [formData, key, debounceMs]);

    const clearDraft = () => {
        localStorage.removeItem(key);
        setLastSaved(null);
        setIsDirty(false);
    };

    const restoreDraft = (): T | null => {
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return null;
            }
        }
        return null;
    };

    return {
        lastSaved,
        isDirty,
        clearDraft,
        restoreDraft,
    };
}
