"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Shield,
    LayoutDashboard,
    FileText,
    Users,
    Database,
    Calendar,
    Archive,
    Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    role?: string;
}

export function PoliceSidebar({ className, role }: SidebarProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const routes = [
        {
            href: "/police",
            label: "Dashboard",
            icon: LayoutDashboard,
            active: pathname === "/police",
        },
        ...(role === "SHO" || role === "ADMIN" || role === "SUPER_ADMIN" ? [{
            href: "/police/roster",
            label: "Duty Roster",
            icon: Calendar,
            active: pathname === "/police/roster",
        }] : []),
        {
            href: "/police/criminals",
            label: "Criminal Database",
            icon: Users,
            active: pathname === "/police/criminals",
        },
        {
            href: "/police/evidence",
            label: "Evidence Room",
            icon: Archive,
            active: pathname === "/police/evidence",
        },
    ];

    const SidebarContent = () => (
        <div className="space-y-4 py-4 h-full flex flex-col bg-card border-r">
            <div className="px-3 py-2">
                <Link href="/police" className="flex items-center pl-3 mb-14">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary mr-3">
                        <Shield className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold">Police Portal</span>
                        <span className="text-xs text-muted-foreground">Station Ops</span>
                    </div>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
                                route.active ? "text-primary bg-primary/10" : "text-muted-foreground"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.active ? "text-primary" : "text-muted-foreground")} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Sidebar */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" className="md:hidden fixed left-4 top-4 z-50">
                        <Menu />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 bg-card w-72">
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className={cn("hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50", className)}>
                <SidebarContent />
            </div>
        </>
    );
}
