"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { NotificationBell } from "@/components/ui/notification-bell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [authorized, setAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check auth state reactively
        if (!isAuthenticated || !user) {
            router.push("/auth");
            setAuthorized(false);
        } else {
            setAuthorized(true);
        }
        setIsLoading(false);
    }, [isAuthenticated, user, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20"></div>
                    <div className="h-4 w-48 rounded bg-muted"></div>
                </div>
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <div className="flex h-screen bg-muted/30">
            <Sidebar />
            <div className="flex-1 flex flex-col ml-64 overflow-hidden">
                <header className="flex h-14 items-center justify-end border-b bg-card px-6">
                    <NotificationBell />
                </header>
                <main className="flex-1 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
