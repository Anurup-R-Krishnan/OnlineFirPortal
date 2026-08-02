"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { getMyDocuments, Document } from "@/lib/document-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    FileText,
    Download,
    Eye,
    CheckCircle,
    Loader2,
    FileIcon
} from "lucide-react";
import { toast } from "sonner";

export default function MyDocumentsPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth");
            return;
        }

        loadDocuments();
    }, [isAuthenticated, router]);

    const loadDocuments = async () => {
        try {
            const data = await getMyDocuments();
            setDocuments(data.documents);
        } catch (error) {
            console.error("Failed to fetch documents:", error);
            toast.error("Failed to load documents");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (doc: Document) => {
        // Implement download logic here
        // For now, redirect to the document URL or make an API call
        window.open(`/api/documents/${doc.id}`, '_blank');
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
                <p className="text-muted-foreground">
                    Manage and view all documents uploaded for your cases
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Uploaded Documents</CardTitle>
                    <CardDescription>
                        List of all evidence and documents submitted with your FIRs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Document Name</TableHead>
                                <TableHead>Related FIR</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No documents found. Documents uploaded with FIRs will appear here.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                documents.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileIcon className="h-4 w-4 text-blue-500" />
                                                {doc.filename}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {doc.fir ? (
                                                <span className="font-mono text-xs">{doc.fir.referenceNumber}</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{doc.documentType}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatFileSize(doc.size)}
                                        </TableCell>
                                        <TableCell>
                                            {doc.verified ? (
                                                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                                    <CheckCircle className="h-3 w-3 mr-1" /> Verified
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Pending</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
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
