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

export function useAutoSave<T extends object>(
    formData: T,
    options: AutoSaveOptions
) {
    const { key, debounceMs = 2000, onSave, onRestore } = options;
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSerialized, setLastSerialized] = useState<string>(() => JSON.stringify(formData));
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Detect form changes during render. React documents this guarded
    // "adjust state during render" pattern as the safe way to derive state
    // from changing input without writing inside an effect.
    const serialized = JSON.stringify(formData);
    if (serialized !== lastSerialized) {
        setLastSerialized(serialized);
        setIsDirty(true);
    }

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    // Auto-save on form data change
    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            const snapshot = JSON.stringify(formData);
            localStorage.setItem(key, snapshot);
            setLastSaved(new Date());
            setLastSerialized(snapshot);
            setIsDirty(false);
            onSave?.();
        }, debounceMs);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, key, debounceMs]);

    const clearDraft = () => {
        localStorage.removeItem(key);
        setLastSerialized(JSON.stringify(formData));
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
