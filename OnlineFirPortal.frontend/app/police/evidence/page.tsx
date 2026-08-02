"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Archive,
    Search,
    Plus,
    Filter,
    FileText,
    MapPin,
    ArrowRightLeft,
    Box,
    History
} from "lucide-react";

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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

import { evidenceApi, Evidence, ChainOfCustodyEntry } from "@/lib/api/evidence";
import { getAllFIRs, FIR } from "@/lib/fir-store";

export default function EvidencePage() {
    const { toast } = useToast();
    const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
    const [firs, setFirs] = useState<FIR[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFirId, setSelectedFirId] = useState<string>("");

    // Create Mode
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newEvidence, setNewEvidence] = useState({
        firId: "",
        type: "",
        description: "",
        quantity: "",
        storageLocation: "",
    });

    // Transfer Mode
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
    const [transferData, setTransferData] = useState({
        action: "TRANSFERRED",
        receiverId: "", // In real app, select user
        location: "",
        purpose: "",
        newStatus: "",
    });

    // History Mode
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [chainHistory, setChainHistory] = useState<ChainOfCustodyEntry[]>([]);

    useEffect(() => {
        loadFirs();
    }, []);

    useEffect(() => {
        if (selectedFirId) {
            loadEvidence(selectedFirId);
        } else {
            setEvidenceList([]);
        }
    }, [selectedFirId]);

    const loadFirs = async () => {
        try {
            const { firs } = await getAllFIRs({ limit: 100 });
            setFirs(firs);
            if (firs.length > 0) {
                setSelectedFirId(firs[0].id);
            }
        } catch (error) {
            console.error("Failed to load FIRs", error);
        }
    };

    const loadEvidence = async (firId: string) => {
        setIsLoading(true);
        try {
            const data = await evidenceApi.getByFir(firId);
            setEvidenceList(data);
        } catch (error) {
            console.error("Failed to load evidence", error);
            toast({
                title: "Error",
                description: "Failed to load evidence",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateEvidence = async () => {
        if (!newEvidence.firId || !newEvidence.type || !newEvidence.description) return;

        try {
            await evidenceApi.create(newEvidence);
            setShowCreateDialog(false);
            setNewEvidence({ ...newEvidence, type: "", description: "", quantity: "", storageLocation: "" });
            toast({
                title: "Success",
                description: "Evidence recorded successfully",
            });
            loadEvidence(newEvidence.firId);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to record evidence",
                variant: "destructive",
            });
        }
    };

    const handleTransfer = async () => {
        if (!selectedEvidence) return;

        try {
            await evidenceApi.transfer(selectedEvidence.id, {
                action: transferData.action,
                purpose: transferData.purpose,
                location: transferData.location,
                newStatus: transferData.newStatus || undefined
            });
            setShowTransferDialog(false);
            toast({
                title: "Success",
                description: "Chain of custody updated",
            });
            loadEvidence(selectedFirId);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to transfer evidence",
                variant: "destructive",
            });
        }
    };

    const viewHistory = async (evidence: Evidence) => {
        try {
            const history = await evidenceApi.getChainOfCustody(evidence.id);
            setChainHistory(history);
            setSelectedEvidence(evidence);
            setShowHistoryDialog(true);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load history",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Evidence Room</h1>
                    <p className="text-muted-foreground">
                        Track and manage evidence custody
                    </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Record Evidence
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Record New Evidence</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Case / FIR</Label>
                                <Select
                                    value={newEvidence.firId}
                                    onValueChange={(v) => setNewEvidence({ ...newEvidence, firId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select FIR" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {firs.map(fir => (
                                            <SelectItem key={fir.id} value={fir.id}>
                                                {fir.referenceNumber}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={newEvidence.type}
                                    onValueChange={(v) => setNewEvidence({ ...newEvidence, type: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Weapon">Weapon</SelectItem>
                                        <SelectItem value="Document">Document</SelectItem>
                                        <SelectItem value="Digital">Digital</SelectItem>
                                        <SelectItem value="Biological">Biological</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={newEvidence.description}
                                    onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Quantity</Label>
                                    <Input
                                        value={newEvidence.quantity}
                                        onChange={(e) => setNewEvidence({ ...newEvidence, quantity: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Storage Location</Label>
                                    <Input
                                        value={newEvidence.storageLocation}
                                        onChange={(e) => setNewEvidence({ ...newEvidence, storageLocation: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateEvidence}>Record</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-[300px]">
                    <Select value={selectedFirId} onValueChange={setSelectedFirId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Case to View" />
                        </SelectTrigger>
                        <SelectContent>
                            {firs.map(fir => (
                                <SelectItem key={fir.id} value={fir.id}>
                                    {fir.referenceNumber} - {fir.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {evidenceList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No evidence recorded for this case
                                </TableCell>
                            </TableRow>
                        ) : (
                            evidenceList.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Box className="h-4 w-4 text-muted-foreground" />
                                            {item.type}
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            {item.storageLocation}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => viewHistory(item)}>
                                                <History className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setSelectedEvidence(item);
                                                setShowTransferDialog(true);
                                            }}>
                                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                                Transfer
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Transfer Dialog */}
            <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Chain of Custody</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Action</Label>
                            <Select
                                value={transferData.action}
                                onValueChange={(v) => setTransferData({ ...transferData, action: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TRANSFERRED">Transfer</SelectItem>
                                    <SelectItem value="STORED">Store</SelectItem>
                                    <SelectItem value="SUBMITTED_TO_LAB">Submit to Lab</SelectItem>
                                    <SelectItem value="SUBMITTED_TO_COURT">Submit to Court</SelectItem>
                                    <SelectItem value="RETURNED">Return</SelectItem>
                                    <SelectItem value="DISPOSED">Dispose</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>New Status</Label>
                            <Select
                                value={transferData.newStatus}
                                onValueChange={(v) => setTransferData({ ...transferData, newStatus: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Update Status (Optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="COLLECTED">Collected</SelectItem>
                                    <SelectItem value="IN_CUSTODY">In Custody</SelectItem>
                                    <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                                    <SelectItem value="IN_LAB">In Lab</SelectItem>
                                    <SelectItem value="IN_COURT">In Court</SelectItem>
                                    <SelectItem value="DISPOSED">Disposed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input
                                value={transferData.location}
                                onChange={(e) => setTransferData({ ...transferData, location: e.target.value })}
                                placeholder="New location"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Purpose / Remarks</Label>
                            <Textarea
                                value={transferData.purpose}
                                onChange={(e) => setTransferData({ ...transferData, purpose: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleTransfer}>Update Custody</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* History Dialog */}
            <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chain of Custody History</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {chainHistory.map((entry, i) => (
                            <div key={entry.id} className="flex gap-4 relative">
                                <div className="flex flex-col items-center">
                                    <div className="h-3 w-3 rounded-full bg-primary" />
                                    {i < chainHistory.length - 1 && <div className="w-px h-full bg-border absolute top-3 bottom-0 left-1.5" style={{ height: '100%' }} />}
                                </div>
                                <div className="pb-6">
                                    <p className="font-semibold">{entry.action}</p>
                                    <p className="text-sm text-muted-foreground">{format(new Date(entry.timestamp), "PPP p")}</p>
                                    <div className="text-sm mt-1 border rounded p-2 bg-muted/20">
                                        <p><span className="font-medium">Handler:</span> {entry.handler.name}</p>
                                        {entry.receiver && <p><span className="font-medium">Receiver:</span> {entry.receiver.name}</p>}
                                        {entry.location && <p><span className="font-medium">Location:</span> {entry.location}</p>}
                                        {entry.purpose && <p><span className="font-medium">Remarks:</span> {entry.purpose}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
