"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Shield,
    LayoutDashboard,
    FileText,
    PlusCircle,
    History,
    Settings,
    Users,
    FileCheck,
    Bell,
    LogOut,
    Files
} from "lucide-react";
import { useAuth, logout } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();

    // Redirect to auth page if not authenticated
    useEffect(() => {
        if (!isAuthenticated || !user) {
            router.push("/auth");
        }
    }, [isAuthenticated, user, router]);

    // Handle logout with redirect
    const handleLogout = () => {
        logout();
        router.push("/auth");
    };

    if (!user || !isAuthenticated) return null;

    const role = user.role;

    const citizenLinks = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/file-fir", label: "File New FIR", icon: PlusCircle },
        { href: "/my-firs", label: "My FIRs", icon: History },
        { href: "/documents", label: "My Documents", icon: Files },
    ];

    const policeLinks = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/fir/assigned", label: "Assigned Cases", icon: FileText },
        { href: "/dashboard/fir/station", label: "Station FIRs", icon: Files },
    ];

    const adminLinks = [
        { href: "/admin", label: "Admin Overview", icon: LayoutDashboard },
        { href: "/admin/users", label: "User Management", icon: Users },
        { href: "/admin/reports", label: "System Reports", icon: FileCheck },
        { href: "/admin/logs", label: "Audit Logs", icon: FileText },
    ];

    const links = role === "CITIZEN"
        ? citizenLinks
        : role === "ADMIN" || role === "SUPER_ADMIN"
            ? adminLinks
            : policeLinks;

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card transition-transform">
            <div className="flex h-full flex-col px-3 py-4">
                <Link href="/" className="mb-8 flex items-center gap-3 px-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                        <Shield className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-lg font-bold text-foreground">FIR Portal</span>
                </Link>

                {/* User Info */}
                <div className="mb-6 rounded-lg bg-muted p-3">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground truncate">{user.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase().replace('_', ' ')}</span>
                        {user.policeStation && (
                            <span className="text-xs text-muted-foreground truncate">{user.policeStation} Station</span>
                        )}
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto space-y-1 border-t border-border pt-4">
                    <Link
                        href="/dashboard/notifications"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <Bell className="h-4 w-4" />
                        Notifications
                    </Link>
                    <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </aside>
    );
}
