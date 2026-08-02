"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Users,
    Search,
    Plus,
    Filter,
    MoreHorizontal,
    FileText,
    Link as LinkIcon,
    AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { criminalsApi, Criminal } from "@/lib/api/criminals";

export default function CriminalsPage() {
    const { toast } = useToast();
    const [criminals, setCriminals] = useState<Criminal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Create Mode
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newCriminal, setNewCriminal] = useState({
        name: "",
        aliases: "",
        mobile: "",
        status: "ACTIVE",
        gender: "MALE",
        dob: "",
        address: "",
        identifyingMarks: "",
    });

    const loadCriminals = async () => {
        setIsLoading(true);
        try {
            const data = await criminalsApi.search(searchQuery);
            setCriminals(data);
        } catch (error) {
            console.error("Failed to load criminals", error);
            toast({
                title: "Error",
                description: "Failed to load criminal records",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadCriminals();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleCreateCriminal = async () => {
        if (!newCriminal.name) return;

        setIsCreating(true);
        try {
            await criminalsApi.create({
                ...newCriminal,
                dateOfBirth: newCriminal.dob ? new Date(newCriminal.dob).toISOString() : undefined,
            });
            setShowCreateDialog(false);
            setNewCriminal({
                name: "",
                aliases: "",
                mobile: "",
                status: "ACTIVE",
                gender: "MALE",
                dob: "",
                address: "",
                identifyingMarks: "",
            });
            toast({
                title: "Success",
                description: "Criminal profile created successfully",
            });
            loadCriminals();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create profile",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'WANTED': return 'destructive';
            case 'IN_CUSTODY': return 'secondary';
            case 'RELEASED': return 'outline';
            case 'ACTIVE': return 'default';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Criminal Database</h1>
                    <p className="text-muted-foreground">
                        Manage criminal profiles and history
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Profile
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, alias, or mobile..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {criminals.map((criminal) => (
                    <Card key={criminal.id} className="overflow-hidden">
                        <CardHeader className="border-b bg-muted/20 pb-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle>{criminal.name}</CardTitle>
                                    <CardDescription>
                                        {criminal.aliases ? `aka ${criminal.aliases}` : "No aliases"}
                                    </CardDescription>
                                </div>
                                <Badge variant={getStatusColor(criminal.status) as any}>
                                    {criminal.status.replace('_', ' ')}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground block text-xs">Mobile</span>
                                    <span className="font-medium">{criminal.mobile || "N/A"}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">Gender</span>
                                    <span className="font-medium">{criminal.gender || "N/A"}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-muted-foreground block text-xs">Address</span>
                                    <span className="font-medium truncate block">{criminal.address || "N/A"}</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-muted-foreground">Involvement</span>
                                    <span className="text-xs text-muted-foreground">{criminal.firs?.length || 0} Cases</span>
                                </div>
                                <div className="space-y-1">
                                    {criminal.firs?.slice(0, 2).map((link, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded">
                                            <span className="font-medium">{link.fir.referenceNumber}</span>
                                            <Badge variant="outline" className="text-[10px] h-5">
                                                {link.involvementType}
                                            </Badge>
                                        </div>
                                    ))}
                                    {(criminal.firs?.length || 0) > 2 && (
                                        <p className="text-xs text-center text-muted-foreground">
                                            +{criminal.firs!.length - 2} more cases
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create Criminal Profile</DialogTitle>
                        <DialogDescription>
                            Add a new criminal record to the database
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={newCriminal.name}
                                    onChange={(e) => setNewCriminal({ ...newCriminal, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="aliases">Aliases</Label>
                                <Input
                                    id="aliases"
                                    value={newCriminal.aliases}
                                    onChange={(e) => setNewCriminal({ ...newCriminal, aliases: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="mobile">Mobile Number</Label>
                                <Input
                                    id="mobile"
                                    value={newCriminal.mobile}
                                    onChange={(e) => setNewCriminal({ ...newCriminal, mobile: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={newCriminal.status}
                                    onValueChange={(v) => setNewCriminal({ ...newCriminal, status: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="WANTED">Wanted</SelectItem>
                                        <SelectItem value="IN_CUSTODY">In Custody</SelectItem>
                                        <SelectItem value="RELEASED">Released</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={newCriminal.address}
                                onChange={(e) => setNewCriminal({ ...newCriminal, address: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="marks">Identifying Marks</Label>
                            <Textarea
                                id="marks"
                                placeholder="Scars, tattoos, birthmarks..."
                                value={newCriminal.identifyingMarks}
                                onChange={(e) => setNewCriminal({ ...newCriminal, identifyingMarks: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateCriminal} disabled={isCreating || !newCriminal.name}>
                            {isCreating ? "Creating..." : "Create Profile"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
