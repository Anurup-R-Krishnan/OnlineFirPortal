"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { NotificationBell } from "@/components/ui/notification-bell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const authorized = isAuthenticated && !!user;

    useEffect(() => {
        if (!authorized) {
            router.push("/auth");
        }
    }, [authorized, router]);

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
