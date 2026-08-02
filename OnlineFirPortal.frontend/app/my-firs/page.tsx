"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { getFIRsByUser, type FIR } from "@/lib/fir-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Filter,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Loader2
} from "lucide-react";

export default function MyFIRsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [firs, setFirs] = useState<FIR[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth");
            return;
        }

        const fetchFIRs = async () => {
            try {
                if (user?.id) {
                    const data = await getFIRsByUser(user.id);
                    setFirs(data);
                }
            } catch (error) {
                console.error("Failed to fetch FIRs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFIRs();
    }, [isAuthenticated, user, router]);

    const getStatusType = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
        switch (status) {
            case "DRAFT": return "secondary";
            case "SUBMITTED": return "warning"; // amber/yellow
            case "UNDER_INVESTIGATION": return "default"; // blue/primary
            case "CLOSED": return "success"; // green
            case "REJECTED": return "destructive"; // red
            default: return "secondary";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "SUBMITTED": return <Clock className="h-3 w-3 mr-1" />;
            case "UNDER_INVESTIGATION": return <AlertCircle className="h-3 w-3 mr-1" />;
            case "CLOSED": return <CheckCircle className="h-3 w-3 mr-1" />;
            default: return null;
        }
    };

    const filteredFIRs = firs.filter(fir => {
        const matchesSearch =
            fir.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fir.crimeType.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || fir.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My FIRs</h1>
                    <p className="text-muted-foreground">
                        Track and manage your filed complaints
                    </p>
                </div>
                <Button onClick={() => router.push("/file-fir")}>
                    File New FIR
                </Button>
            </div>

            <Card>
                <CardHeader className="p-4 md:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by FIR No. or Type..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <select
                                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">All Status</option>
                                <option value="DRAFT">Drafts</option>
                                <option value="SUBMITTED">Submitted</option>
                                <option value="UNDER_INVESTIGATION">Active</option>
                                <option value="CLOSED">Closed</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>FIR Number</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date Filed</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredFIRs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No FIRs found matching your criteria
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredFIRs.map((fir) => (
                                    <TableRow key={fir.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/my-firs/${fir.id}`)}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                {fir.referenceNumber}
                                            </div>
                                        </TableCell>
                                        <TableCell>{fir.crimeType}</TableCell>
                                        <TableCell>
                                            {new Date(fir.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusType(fir.status)} className="gap-1">
                                                {getStatusIcon(fir.status)}
                                                {fir.status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
