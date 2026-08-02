"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Search,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyDocuments, type Document } from "@/lib/document-store";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    closed: 0
  });
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);

  useEffect(() => {
    if (!user || !token) return;

    const loadDashboardData = async () => {
      try {
        const res = await fetch('/api/firs/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setStats({
            total: data.total || 0,
            pending: data.pending || 0,
            active: data.investigation || 0, // API returns 'investigation' for active
            closed: data.closed || 0
          });
        }
        const docs = await getMyDocuments({ page: 1, limit: 5 });
        setRecentDocuments(docs.documents || []);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    };

    loadDashboardData();
  }, [user, token, router]);

  if (!user) return null;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name}. Here&apos;s an overview of your activity.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total FIRs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting officer assignment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently under investigation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Cases</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Specific Actions */}
      {user.role === 'CITIZEN' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push('/file-fir')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                File New FIR
              </CardTitle>
              <CardDescription>
                Report a cognizable offense instantly
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push('/track')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Track Status
              </CardTitle>
              <CardDescription>
                Check progress of your filed complaints
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Documents
              </CardTitle>
              <CardDescription>
                Quick access to your latest uploaded files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No documents found. Documents uploaded with FIRs will appear here.
                </p>
              ) : (
                recentDocuments.slice(0, 3).map((doc) => (
                  <button
                    key={doc.id}
                    className="w-full text-left rounded-md border p-2 hover:bg-muted/40 transition-colors"
                    onClick={() => router.push('/documents')}
                  >
                    <p className="text-sm font-medium truncate">{doc.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.fir?.referenceNumber || "Unlinked document"}
                    </p>
                  </button>
                ))
              )}
              <Button variant="outline" className="w-full" onClick={() => router.push('/documents')}>
                View All Documents
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {(user.role === 'OFFICER' || user.role === 'SHO' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push('/police')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Assigned Cases
              </CardTitle>
              <CardDescription>
                View cases assigned to you
              </CardDescription>
            </CardHeader>
          </Card>
          {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push('/admin/users')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Manage Users
                </CardTitle>
                <CardDescription>
                  Create and manage officer accounts
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
