import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { type UserRole } from "./security"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function hasPermission(role: UserRole, resource: string, action: string): boolean {
    const permissions: Record<UserRole, Record<string, string[]>> = {
        CITIZEN: { fir: ['create', 'read'], documents: ['upload', 'read'] },
        OFFICER: { fir: ['read', 'update'], documents: ['read'], users: ['read'] },
        SHO: { fir: ['read', 'update', 'delete'], documents: ['read', 'delete'], users: ['read', 'update'] },
        ADMIN: { fir: ['read', 'update', 'delete'], documents: ['read', 'delete'], users: ['read', 'update', 'delete'] },
        SUPER_ADMIN: { fir: ['read', 'update', 'delete'], documents: ['read', 'delete'], users: ['read', 'update', 'delete'] }
    };
    return permissions[role]?.[resource]?.includes(action) || false;
}
