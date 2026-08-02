"use client";

import { PoliceSidebar } from "@/components/police/Sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, logout } from "@/lib/auth-store";
import { NotificationBell } from "@/components/ui/notification-bell";
import { Button } from "@/components/ui/button";
import { User, LogOut, Bell } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function PoliceLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [authorized, setAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            router.push("/auth");
            setAuthorized(false);
        } else if (user.role === 'CITIZEN') {
            router.push("/dashboard");
            setAuthorized(false);
        } else {
            setAuthorized(true);
        }
        setIsLoading(false);
    }, [isAuthenticated, user, router]);

    const handleLogout = () => {
        logout();
        router.push("/auth");
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <div className="flex h-screen bg-muted/30">
            <PoliceSidebar role={user?.role} />
            <div className="flex-1 flex flex-col md:ml-72 transition-all duration-300">
                <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card/95 backdrop-blur px-6">
                    <div className="flex items-center gap-4">
                        {/* Mobile trigger would be here if not in sidebar component */}
                    </div>

                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="hidden sm:flex">
                            {user?.policeStation || "Central Police Station"}
                        </Badge>
                        <NotificationBell />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <span className="hidden sm:inline">{user?.name}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="flex flex-col items-start" disabled>
                                    <span className="font-medium">{user?.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {user?.badgeNumber || user?.role}
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6 w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
