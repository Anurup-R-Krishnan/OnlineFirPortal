"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, LogOut, Users, FileText, Settings, BarChart3 } from "lucide-react";
import { logout, useAuth, type User as AuthUser, getAccessToken, completeLogin } from "@/lib/auth-store";
import { type FIR } from "@/lib/fir-store";

type AdminUser = AuthUser;

interface AdminDocument {
  id: string;
  firId: string;
  filename: string;
  mimetype?: string;
  size?: number;
  createdAt?: string;
}

interface ReportSummary {
  firs: Record<string, number>;
  users: Record<string, number>;
  documents: { total: number };
}

interface AdminSettings {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  supportEmail: string;
  emergencyHelpline: string;
}

function withAuthHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = getAccessToken();
  if (!token) return headers;
  return { ...headers, Authorization: `Bearer ${token}` };
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [firs, setFirs] = useState<FIR[]>([]);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [reports, setReports] = useState<ReportSummary | null>(null);
  const [settings, setSettings] = useState<AdminSettings>({
    maintenanceMode: false,
    allowRegistration: true,
    supportEmail: "support@onlinefir.gov.in",
    emergencyHelpline: "112"
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fetchAdminJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const requestInit: RequestInit = {
      credentials: "include",
      ...init,
      headers: withAuthHeaders(init?.headers || {})
    };

    const res = await fetch(url, requestInit);
    if (res.status === 401 && user) {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include"
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData?.accessToken) {
          completeLogin(user, refreshData.accessToken);
          const retryRes = await fetch(url, {
            ...requestInit,
            headers: withAuthHeaders(init?.headers || {})
          });
          if (retryRes.ok) {
            return retryRes.json();
          }
          const retryError = await retryRes.json().catch(() => ({}));
          throw new Error(retryError.error || `Request failed (${retryRes.status})`);
        }
      }
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return res.json();
  };

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  const loadData = async () => {
    setError("");
    try {
      const [usersData, docsData, reportData, settingsData, firsData] = await Promise.all([
        fetchAdminJson<AdminUser[]>("/api/admin/users"),
        fetchAdminJson<AdminDocument[]>("/api/admin/documents"),
        fetchAdminJson<ReportSummary>("/api/admin/reports/summary"),
        fetchAdminJson<Partial<AdminSettings>>("/api/admin/settings"),
        fetchAdminJson<FIR[]>("/api/admin/firs")
      ]);

      setUsers(usersData);
      setDocuments(docsData);
      setReports(reportData);
      setSettings((prev) => ({
        ...prev,
        ...settingsData
      }));
      setFirs(firsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }

    if (user.role === "CITIZEN") {
      router.push("/dashboard");
      return;
    }

    if (user.role === "OFFICER" || user.role === "SHO") {
      router.push("/police");
      return;
    }

    const initialize = async () => {
      await loadData();
      setIsLoading(false);
    };

    void initialize();
  }, [user, router]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Delete this user and all related FIR data?")) return;
    try {
      await fetchAdminJson(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleDeleteFIR = async (firId: string) => {
    if (!confirm("Delete this FIR and its documents/timeline?")) return;
    try {
      await fetchAdminJson(`/api/admin/firs/${encodeURIComponent(firId)}`, { method: "DELETE" });
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete FIR");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await fetchAdminJson(`/api/admin/documents/${encodeURIComponent(docId)}`, { method: "DELETE" });
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setError("");
    try {
      const updated = await fetchAdminJson<Partial<AdminSettings>>("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      setSettings((prev) => ({ ...prev, ...updated }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    }
    setIsSavingSettings(false);
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight text-foreground">Online FIR Portal</span>
              <span className="text-xs text-muted-foreground">Admin Console</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline">Admin</Badge>
            <Button variant="ghost" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 space-y-6 px-4 py-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reports" className="gap-2"><BarChart3 className="h-4 w-4" />Reports</TabsTrigger>
            <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />Users</TabsTrigger>
            <TabsTrigger value="firs" className="gap-2"><FileText className="h-4 w-4" />FIRs</TabsTrigger>
            <TabsTrigger value="documents" className="gap-2"><FileText className="h-4 w-4" />Documents</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" />Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>System Summary</CardTitle>
                <CardDescription>Overview of FIRs, users, and documents.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Total FIRs</p>
                  <p className="text-2xl font-bold">{reports?.firs?.total ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Pending: {reports?.firs?.pending ?? 0}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Users</p>
                  <p className="text-2xl font-bold">{Object.values(reports?.users || {}).reduce((a, b) => a + b, 0)}</p>
                  <p className="text-xs text-muted-foreground">Admins: {reports?.users?.admin ?? 0}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-2xl font-bold">{reports?.documents?.total ?? 0}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage registered users and roles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users found.</p>
                ) : (
                  users.map((u) => (
                    <div key={u.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium">{u.name} <span className="text-xs text-muted-foreground">({u.email})</span></p>
                        <p className="text-xs text-muted-foreground">Role: {u.role} · Mobile: {u.mobile}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{u.role}</Badge>
                        {u.role !== "ADMIN" && u.role !== "SUPER_ADMIN" && (
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(u.id)}>Delete</Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="firs">
            <Card>
              <CardHeader>
                <CardTitle>FIR Records</CardTitle>
                <CardDescription>Delete FIRs across the system.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {firs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No FIRs found.</p>
                ) : (
                  firs.map((fir) => (
                    <div key={fir.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium">{fir.referenceNumber}</p>
                        <p className="text-xs text-muted-foreground">Status: {fir.status} · Type: {fir.title}</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteFIR(fir.id)}>Delete</Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Manage uploaded documents.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents found.</p>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">FIR: {doc.firId} · {doc.mimetype || "unknown"} · {doc.size || 0} bytes</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteDocument(doc.id)}>Delete</Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Update platform-wide settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Maintenance Mode</p>
                    <p className="text-xs text-muted-foreground">Temporarily disable the portal for end users.</p>
                  </div>
                  <Switch checked={settings.maintenanceMode} onCheckedChange={(value) => setSettings((prev) => ({ ...prev, maintenanceMode: value }))} />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Allow Registration</p>
                    <p className="text-xs text-muted-foreground">Control whether new user sign-ups are enabled.</p>
                  </div>
                  <Switch checked={settings.allowRegistration} onCheckedChange={(value) => setSettings((prev) => ({ ...prev, allowRegistration: value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input value={settings.supportEmail} onChange={(e) => setSettings((prev) => ({ ...prev, supportEmail: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>Emergency Helpline</Label>
                  <Input value={settings.emergencyHelpline} onChange={(e) => setSettings((prev) => ({ ...prev, emergencyHelpline: e.target.value }))} />
                </div>

                <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                  {isSavingSettings ? "Saving..." : "Save Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
