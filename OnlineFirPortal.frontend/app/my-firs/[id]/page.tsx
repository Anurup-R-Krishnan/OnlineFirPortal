"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { getFIRById, type FIR } from "@/lib/fir-store";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Clock,
    MapPin,
    FileText,
    Shield,
    Calendar,
    User,
    CheckCircle,
    AlertCircle,
    Download,
    Printer,
    Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function FIRDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [fir, setFir] = useState<FIR | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth");
            return;
        }

        const fetchFIR = async () => {
            try {
                if (params.id) {
                    const data = await getFIRById(params.id as string);
                    setFir(data);
                }
            } catch (error: unknown) {
                console.error("Failed to fetch FIR:", error);
                const message = error instanceof Error ? error.message : undefined;
                if (message === "AUTH_REQUIRED") {
                    router.push("/auth");
                    return;
                }
                if (message === "FORBIDDEN") {
                    setErrorMessage("You do not have permission to view this FIR.");
                } else {
                    setErrorMessage("Failed to load FIR details due to a server error. Please try again.");
                }
                toast.error("Failed to load FIR details");
            } finally {
                setLoading(false);
            }
        };

        fetchFIR();
    }, [isAuthenticated, params.id, router]);

    const handleDownloadReceipt = () => {
        if (!fir) return;
        const lines = [
            'Online FIR Portal - FIR Receipt',
            '--------------------------------',
            `Reference Number: ${fir.referenceNumber}`,
            `Status: ${fir.status}`,
            `Complaint Type: ${fir.crimeType}`,
            `Incident Date: ${new Date(fir.incidentDate).toLocaleDateString()}`,
            `Incident Time: ${fir.incidentTime || 'N/A'}`,
            `Incident Place: ${fir.incidentPlace}`,
            `District: ${fir.incidentDistrict || 'N/A'}`,
            `State: ${fir.incidentState || 'N/A'}`,
            `Filed By: ${fir.reporter?.name || 'N/A'}`,
            `Created At: ${new Date(fir.createdAt).toLocaleString()}`,
            '',
            'Description:',
            `${fir.description}`,
        ];
        const content = lines.join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fir.referenceNumber}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading FIR details...</div>;
    }

    if (errorMessage) {
        return (
            <div className="container max-w-4xl mx-auto py-8">
                <Card className="border-border">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Unable to Open FIR</h2>
                        <p className="text-muted-foreground mb-6">{errorMessage}</p>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => router.refresh()}>
                                Retry
                            </Button>
                            <Button onClick={() => router.push("/my-firs")}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to My FIRs
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!fir) {
        return (
            <div className="container max-w-4xl mx-auto py-8">
                <Card className="border-border">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold mb-2">FIR Not Found</h2>
                        <p className="text-muted-foreground mb-6">
                            The FIR could not be found. It may have been removed or you may not have access.
                        </p>
                        <Button onClick={() => router.push("/my-firs")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to My FIRs
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-5xl py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        FIR Details
                        <Badge variant="outline" className="ml-2 font-mono text-sm">
                            {fir.referenceNumber}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Filed on {new Date(fir.createdAt).toLocaleDateString()} at {new Date(fir.createdAt).toLocaleTimeString()}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    {/* Status Card */}
                    <Card className="border-l-4 border-l-primary shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Current Status</p>
                                    <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                        {fir.status === 'SUBMITTED' && <Clock className="h-5 w-5" />}
                                        {fir.status === 'UNDER_INVESTIGATION' && <AlertCircle className="h-5 w-5" />}
                                        {fir.status === 'CLOSED' && <CheckCircle className="h-5 w-5" />}
                                        {fir.status.replace(/_/g, ' ')}
                                    </h3>
                                </div>
                                {fir.assignedOfficer && (
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Assigned Officer</p>
                                        <div className="font-semibold">{fir.assignedOfficer.name}</div>
                                        <div className="text-xs text-muted-foreground">{fir.assignedOfficer.rank || 'Officer'}</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Complaint Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-5 w-5 text-primary" />
                                Complaint Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">Complaint Type</div>
                                    <div className="font-medium">{fir.crimeType}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">Incident Date & Time</div>
                                    <div className="font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {new Date(fir.incidentDate).toLocaleDateString()}
                                        <span className="text-muted-foreground mx-1">•</span>
                                        {fir.incidentTime || 'Not specified'}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-2">Description</div>
                                <div className="bg-muted/30 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                                    {fir.description}
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">Location of Incident</div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <span>
                                        {fir.incidentPlace}
                                        {fir.incidentDistrict && `, ${fir.incidentDistrict}`}
                                        {fir.incidentState && `, ${fir.incidentState}`}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock className="h-5 w-5 text-primary" />
                                Case Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8 relative pl-4 border-l border-muted ml-2">
                                {fir.timeline && fir.timeline.length > 0 ? (
                                    fir.timeline.map((event, index) => (
                                        <div key={event.id} className="relative">
                                            <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium">{event.action}</span>
                                                {event.details && (
                                                    <span className="text-xs text-muted-foreground">{event.details}</span>
                                                )}
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    <User className="h-3 w-3" />
                                                    <span>{event.actorName}</span>
                                                    <span>•</span>
                                                    <span>{new Date(event.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground italic">No timeline events recorded yet.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button className="w-full justify-start gap-2" variant="outline" onClick={handleDownloadReceipt}>
                                <Download className="h-4 w-4" />
                                Download Receipt
                            </Button>
                            <Button className="w-full justify-start gap-2" variant="outline" onClick={() => window.print()}>
                                <Printer className="h-4 w-4" />
                                Print Page
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                Documents
                                <Badge variant="secondary" className="ml-2">{fir.documents ? fir.documents.length : 0}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {fir.documents && fir.documents.length > 0 ? (
                                    fir.documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium truncate">{doc.filename}</span>
                                                    <span className="text-xs text-muted-foreground">{doc.documentType}</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                <Link href={`/api/documents/${doc.id}`} target="_blank">
                                                    <LinkIcon className="h-3 w-3" />
                                                </Link>
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-sm text-muted-foreground">
                                        No documents attached
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="ghost" className="w-full text-xs" asChild>
                                <Link href="/documents">View All My Documents</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
