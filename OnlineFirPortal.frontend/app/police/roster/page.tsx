"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Clock, MapPin, User, Shield } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import { rosterApi, DutyShift } from "@/lib/api/roster";
import { useAuth } from "@/lib/auth-store";

export default function DutyRosterPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [date, setDate] = useState<Date>(new Date());
    const [shifts, setShifts] = useState<DutyShift[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);

    // Assignment Form State
    const [officerId, setOfficerId] = useState(""); // Ideally a select from officer list
    const [shiftType, setShiftType] = useState("MORNING");
    const [startTime, setStartTime] = useState("08:00");
    const [endTime, setEndTime] = useState("16:00");
    const [location, setLocation] = useState("");

    useEffect(() => {
        if (!user) return;
        if (user.role === "OFFICER") {
            router.replace("/police");
        }
    }, [user, router]);

    const loadRoster = async () => {
        setIsLoading(true);
        try {
            const data = await rosterApi.getRoster(date);
            setShifts(data);
        } catch (error) {
            console.error("Failed to load roster", error);
            toast({
                title: "Error",
                description: "Failed to load duty roster",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRoster();
    }, [date]);

    const handleAssignShift = async () => {
        if (!officerId || !startTime || !endTime) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        // Construct date-time objects
        // Note: Assuming assignment is for selected 'date'
        const startDateTime = new Date(date);
        const [startHour, startMinute] = startTime.split(':').map(Number);
        startDateTime.setHours(startHour, startMinute);

        const endDateTime = new Date(date);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        // Handle overnight shifts
        if (endHour < startHour) {
            endDateTime.setDate(endDateTime.getDate() + 1);
        }
        endDateTime.setHours(endHour, endMinute);

        setIsAssigning(true);
        try {
            await rosterApi.assignShift({
                officerId, // In real app this would be a user ID from a dropdown
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                type: shiftType,
                location,
            });

            toast({
                title: "Success",
                description: "Shift assigned successfully",
            });
            loadRoster();
            setOfficerId(""); // Reset form
        } catch (error) {
            console.error("Failed to assign shift", error);
            toast({
                title: "Error",
                description: "Failed to assign shift",
                variant: "destructive",
            });
        } finally {
            setIsAssigning(false);
        }
    };

    // Group shifts by type
    const shiftsByType = {
        MORNING: shifts.filter(s => s.type === 'MORNING'),
        EVENING: shifts.filter(s => s.type === 'EVENING'),
        NIGHT: shifts.filter(s => s.type === 'NIGHT'),
        GENERAL: shifts.filter(s => s.type === 'GENERAL'),
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Duty Roster</h1>
                    <p className="text-muted-foreground">
                        Manage officer shifts and assignments
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && setDate(d)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>Assign Shift</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Assign Duty Shift</DialogTitle>
                                <DialogDescription>
                                    Assign an officer to a shift for {format(date, "PPP")}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="officer" className="text-right">Officer ID</Label>
                                    <Input
                                        id="officer"
                                        className="col-span-3"
                                        placeholder="Enter Officer ID"
                                        value={officerId}
                                        onChange={(e) => setOfficerId(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="type" className="text-right">Shift Type</Label>
                                    <Select value={shiftType} onValueChange={setShiftType}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MORNING">Morning (8AM - 4PM)</SelectItem>
                                            <SelectItem value="EVENING">Evening (4PM - 12AM)</SelectItem>
                                            <SelectItem value="NIGHT">Night (12AM - 8AM)</SelectItem>
                                            <SelectItem value="GENERAL">General (9AM - 5PM)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="start" className="text-right">Start Time</Label>
                                    <Input
                                        id="start"
                                        type="time"
                                        className="col-span-3"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="end" className="text-right">End Time</Label>
                                    <Input
                                        id="end"
                                        type="time"
                                        className="col-span-3"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="location" className="text-right">Location</Label>
                                    <Input
                                        id="location"
                                        className="col-span-3"
                                        placeholder="Beat No. / Area"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAssignShift} disabled={isAssigning}>
                                    {isAssigning ? "Assigning..." : "Assign Shift"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {['MORNING', 'GENERAL', 'EVENING', 'NIGHT'].map((type) => (
                    <Card key={type} className="h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {type} SHIFT
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {shiftsByType[type as keyof typeof shiftsByType].length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No officers assigned</p>
                                ) : (
                                    shiftsByType[type as keyof typeof shiftsByType].map((shift) => (
                                        <div key={shift.id} className="flex flex-col space-y-2 border rounded-lg p-3 bg-muted/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{shift.officer.name}</p>
                                                        <p className="text-xs text-muted-foreground">{shift.officer.badgeNumber}</p>
                                                    </div>
                                                </div>
                                                <Badge variant={shift.status === 'ON_DUTY' ? 'default' : 'secondary'}>
                                                    {shift.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                        {format(new Date(shift.startTime), 'HH:mm')} -
                                                        {shift.endTime ? format(new Date(shift.endTime), 'HH:mm') : '?'}
                                                    </span>
                                                </div>
                                                {shift.location && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        <span className="truncate">{shift.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
