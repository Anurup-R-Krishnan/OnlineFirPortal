"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Info } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth-store";

interface Notification {
    id: string;
    type: "SMS" | "EMAIL" | "IN_APP";
    subject: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export function NotificationBell() {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // Poll for notifications
    useEffect(() => {
        if (!token) return;

        const fetchNotifications = async () => {
            try {
                const res = await fetch("/api/notifications", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);
                    setUnreadCount(data.filter((n: Notification) => !n.read).length);
                }
            } catch (e) {
                console.error("Failed to fetch notifications", e);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 40000); // 30s poll
        return () => clearInterval(interval);
    }, [token]);

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications/read-all", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b p-4">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-muted-foreground">
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        <div className="grid">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-4 border-b p-4 text-sm last:border-0 ${n.read ? 'bg-background' : 'bg-muted/30'}`}
                                >
                                    <Info className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                                    <div className="grid gap-1">
                                        <p className="font-medium">{n.subject}</p>
                                        <p className="text-muted-foreground">{n.message}</p>
                                        <p className="text-xs text-muted-foreground/70">
                                            {new Date(n.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="border-t p-2">
                    <Button variant="ghost" className="w-full text-xs" asChild>
                        <a href="/notifications">View all notifications</a>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
