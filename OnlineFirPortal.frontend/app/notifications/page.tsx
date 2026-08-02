"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, ArrowLeft, Trash2 } from "lucide-react";

interface Notification {
    id: string;
    type: "SMS" | "EMAIL" | "IN_APP";
    subject: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchNotifications = async () => {
            try {
                const res = await fetch("/api/notifications", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);
                }
            } catch (e) {
                console.error("Failed to fetch notifications", e);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, [user, token]);

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications/read-all", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (e) { console.error(e); }
    };

    if (!user) return <div className="p-8">Please log in to view notifications.</div>;

    return (
        <div className="container max-w-4xl mx-auto py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">Stay updated on your case status and alerts</p>
                </div>
                {notifications.some(n => !n.read) && (
                    <Button onClick={markAllRead} variant="outline" className="gap-2">
                        <Check className="h-4 w-4" />
                        Mark all read
                    </Button>
                )}
            </div>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Recent Updates
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                        {loading ? (
                            <div className="flex justify-center p-8">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No notifications yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`flex flex-col gap-2 rounded-lg border p-4 transition-colors ${n.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <h4 className={`font-semibold ${!n.read && 'text-primary'}`}>
                                                {n.subject}
                                            </h4>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {n.message}
                                        </p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-mono">
                                                {n.type}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
