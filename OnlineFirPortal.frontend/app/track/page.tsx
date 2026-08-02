"use client";

import React from "react"

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Search,
  FileCheck,
  Clock,
  User,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ArrowLeft,
  Download,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  FileText,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { getFIRById, type FIRStatus } from "@/lib/fir-store";

interface FIRDetails {
  referenceNumber: string;
  status: FIRStatus;
  complainantName: string;
  filedDate: string;
  complaintType: string;
  policeStation: string;
  officerName: string;
  officerDesignation: string;
  officerContact: string;
  lastUpdate: string;
  description: string;
  incidentLocation: string;
  timeline: {
    date: string;
    time: string;
    status: string;
    description: string;
    isActive: boolean;
  }[];
}

const statusConfig: Record<FIRStatus, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  SUBMITTED: { label: "Submitted", color: "bg-blue-100 text-blue-800" },
  UNDER_INVESTIGATION: {
    label: "Under Investigation",
    color: "bg-yellow-100 text-yellow-800",
  },
  CLOSED: { label: "Closed", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
};

export default function TrackPage() {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<FIRDetails | null>(null);
  const [error, setError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!referenceNumber.trim()) {
      setError("Please enter a reference number");
      return;
    }

    setIsSearching(true);

    try {
      const fir = await getFIRById(referenceNumber);
      if (fir) {
        const mappedResult: FIRDetails = {
          referenceNumber: fir.referenceNumber,
          status: fir.status,
          complainantName: fir.reporter?.name || "Anonymous",
          filedDate: new Date(fir.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
          complaintType: fir.crimeType,
          policeStation: fir.assignedStation || "Not Assigned",
          officerName: fir.assignedOfficer?.name || "Not Assigned",
          officerDesignation: fir.assignedOfficer?.rank || "Officer",
          officerContact: "Contact Station",
          lastUpdate: new Date(fir.updatedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
          description: fir.description,
          incidentLocation: fir.incidentPlace,
          timeline: fir.timeline.map(t => ({
            date: new Date(t.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
            time: new Date(t.createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
            status: t.action,
            description: t.details || "",
            isActive: false
          }))
        };
        setResult(mappedResult);
      } else {
        setError(
          "No FIR found with this reference number. Please check and try again."
        );
      }
    } catch {
      setError("An error occurred while fetching FIR details.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim()) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setFeedbackSent(true);
    setFeedbackMessage("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight text-foreground">
                Online FIR Portal
              </span>
              <span className="text-xs text-muted-foreground">
                Track Your FIR
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Search Section */}
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h1 className="mb-4 text-3xl font-bold text-foreground">
              Track Your FIR Status
            </h1>
            <p className="mb-8 text-muted-foreground">
              Enter your FIR reference number to view the current status,
              investigation progress, and officer details.
            </p>

            <Card className="border-border">
              <CardContent className="p-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="refNumber" className="sr-only">
                      FIR Reference Number
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="refNumber"
                        placeholder="Enter FIR Reference Number (e.g., FIR-2026-MH-00042857)"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="flex-1 text-center text-lg"
                      />
                      <Button
                        type="submit"
                        disabled={isSearching}
                        size="lg"
                        className="gap-2"
                      >
                        {isSearching ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                        Track
                      </Button>
                    </div>
                  </div>
                  {error && (
                    <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          {result && (
            <div className="mx-auto max-w-4xl space-y-6">
              {/* Status Overview Card */}
              <Card className="overflow-hidden border-border">
                <div className="bg-primary p-6 text-primary-foreground">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm opacity-80">Reference Number</p>
                      <h2 className="text-2xl font-bold">
                        {result.referenceNumber}
                      </h2>
                    </div>
                    <Badge
                      className={`${statusConfig[result.status].color} text-sm`}
                    >
                      {statusConfig[result.status].label}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-start gap-3">
                      <FileText className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Complaint Type
                        </p>
                        <p className="font-medium">{result.complaintType}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Filed Date
                        </p>
                        <p className="font-medium">{result.filedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Police Station
                        </p>
                        <p className="font-medium">{result.policeStation}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Last Update
                        </p>
                        <p className="font-medium">{result.lastUpdate}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for Details */}
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="details">Case Details</TabsTrigger>
                  <TabsTrigger value="officer">Officer Info</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="mt-6">
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Investigation Timeline
                      </CardTitle>
                      <CardDescription>
                        Track the progress of your case
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative space-y-0">
                        {result.timeline.map((item, index) => (
                          <div key={index} className="flex gap-4 pb-8 last:pb-0">
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${item.isActive
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-card"
                                  }`}
                              >
                                {item.isActive ? (
                                  <Clock className="h-5 w-5" />
                                ) : (
                                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              {index !== result.timeline.length - 1 && (
                                <div className="h-full w-0.5 bg-border" />
                              )}
                            </div>
                            <div className="flex-1 pt-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4
                                  className={`font-semibold ${item.isActive ? "text-primary" : "text-foreground"}`}
                                >
                                  {item.status}
                                </h4>
                                {item.isActive && (
                                  <Badge className="bg-primary/10 text-primary">
                                    Latest
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {item.date} at {item.time}
                              </p>
                              <p className="mt-2 text-sm text-foreground">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="details" className="mt-6">
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-primary" />
                        Case Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="mb-2 font-semibold text-foreground">
                          Incident Description
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {result.description}
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <h4 className="mb-2 font-semibold text-foreground">
                            Complainant
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {result.complainantName}
                          </p>
                        </div>
                        <div>
                          <h4 className="mb-2 font-semibold text-foreground">
                            Incident Location
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {result.incidentLocation}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button className="gap-2">
                          <Download className="h-4 w-4" />
                          Download FIR Copy
                        </Button>
                        <Button variant="outline" className="gap-2 bg-transparent">
                          <FileText className="h-4 w-4" />
                          View Full Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="officer" className="mt-6">
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Investigating Officer
                      </CardTitle>
                      <CardDescription>
                        Contact the officer assigned to your case
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-10 w-10 text-primary" />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <h4 className="text-lg font-semibold text-foreground">
                              {result.officerName}
                            </h4>
                            <p className="text-muted-foreground">
                              {result.officerDesignation}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {result.policeStation}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <Button
                              variant="outline"
                              className="gap-2 bg-transparent"
                              asChild
                            >
                              <a href={`tel:${result.officerContact}`}>
                                <Phone className="h-4 w-4" />
                                {result.officerContact}
                              </a>
                            </Button>
                            <Button variant="outline" className="gap-2 bg-transparent">
                              <Mail className="h-4 w-4" />
                              Send Email
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="feedback" className="mt-6">
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Provide Feedback
                      </CardTitle>
                      <CardDescription>
                        Share additional information or provide feedback
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {feedbackSent ? (
                        <div className="flex flex-col items-center py-8 text-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <h4 className="mb-2 text-lg font-semibold">
                            Feedback Submitted!
                          </h4>
                          <p className="text-muted-foreground">
                            Thank you for your feedback. The investigating officer
                            will review it.
                          </p>
                          <Button
                            variant="outline"
                            className="mt-4 bg-transparent"
                            onClick={() => setFeedbackSent(false)}
                          >
                            Send Another Message
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="feedback">Your Message</Label>
                            <Textarea
                              id="feedback"
                              placeholder="Provide any additional information, updates, or feedback related to your case..."
                              className="min-h-[120px]"
                              value={feedbackMessage}
                              onChange={(e) => setFeedbackMessage(e.target.value)}
                            />
                          </div>
                          <Button
                            onClick={handleSendFeedback}
                            disabled={!feedbackMessage.trim()}
                            className="gap-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Send Feedback
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
