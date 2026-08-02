"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  Key,
  Bell,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-store";
import { getFIRsByUser, type FIR } from "@/lib/fir-store";

const defaultProfile = {
  name: "Citizen",
  email: "",
  phone: "",
  aadhaar: "",
  address: "Not provided",
  dob: "Not provided",
  registeredOn: "Not available",
  totalFIRs: 0,
  activeCases: 0,
};

function formatDate(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString();
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [formInitializedFor, setFormInitializedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser) {
      router.push("/auth");
    }
  }, [authUser, router]);

  // Initialize the editable form from the logged-in user, once per identity.
  // React documents this "adjust state during render" pattern as the safe way
  // to derive state from changing props without writing inside an effect.
  if (authUser && formInitializedFor !== authUser.id) {
    setFormInitializedFor(authUser.id);
    setFormData({
      name: authUser.name || "",
      email: authUser.email || "",
      phone: authUser.mobile || "",
      address: "",
    });
  }

  useEffect(() => {
    if (!authUser) return;
    (async () => {
      try {
        const userFIRs = await getFIRsByUser(authUser.id);
        const activeStatuses: FIR["status"][] = ["SUBMITTED", "UNDER_INVESTIGATION"];
        setStats({
          total: userFIRs.length,
          active: userFIRs.filter((fir) => activeStatuses.includes(fir.status)).length,
        });
      } catch {
        setStats({ total: 0, active: 0 });
      }
    })();
  }, [authUser]);

  const userProfile = {
    ...defaultProfile,
    name: authUser?.name || defaultProfile.name,
    email: authUser?.email || defaultProfile.email,
    phone: authUser?.mobile || defaultProfile.phone,
    aadhaar: authUser?.aadhaar || defaultProfile.aadhaar,
    registeredOn: formatDate(authUser?.createdAt),
    totalFIRs: stats.total,
    activeCases: stats.active,
  };

  const initials = userProfile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "NA";

  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    caseUpdates: true,
    newsletter: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight text-foreground">
                Online FIR Portal
              </span>
              <span className="text-xs text-muted-foreground">My Profile</span>
            </div>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <div className="mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {userProfile.name}
                </h1>
                <Badge className="bg-green-100 text-green-700">Verified</Badge>
              </div>
              <p className="text-muted-foreground">
                Registered since {userProfile.registeredOn}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {userProfile.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {userProfile.phone}
                </span>
              </div>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {userProfile.totalFIRs}
                </p>
                <p className="text-xs text-muted-foreground">Total FIRs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {userProfile.activeCases}
                </p>
                <p className="text-xs text-muted-foreground">Active Cases</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal">
              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Manage your personal details and contact information
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      className="gap-2 bg-transparent"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  ) : (
                    <Button
                      className="gap-2"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          disabled={!isEditing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="dob"
                          value={userProfile.dob}
                          disabled
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Residential Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        disabled={!isEditing}
                        className="min-h-[80px] pl-10"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Aadhaar Number</p>
                        <p className="text-sm text-muted-foreground">
                          {userProfile.aadhaar}
                        </p>
                      </div>
                      <Badge className="ml-auto bg-green-100 text-green-700">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your password and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Change Password</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          placeholder="Enter current password"
                        />
                      </div>
                      <div />
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Enter new password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                    <Button>Update Password</Button>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h4 className="mb-4 font-medium">Two-Factor Authentication</h4>
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="font-medium">SMS Verification</p>
                        <p className="text-sm text-muted-foreground">
                          Receive OTP on your registered mobile number
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <h4 className="mb-4 font-medium">Login History</h4>
                    <div className="space-y-3">
                      {[
                        {
                          device: "Chrome on Windows",
                          location: "Mumbai, India",
                          time: "2 hours ago",
                          current: true,
                        },
                        {
                          device: "Mobile App - Android",
                          location: "Mumbai, India",
                          time: "Yesterday",
                          current: false,
                        },
                        {
                          device: "Safari on iPhone",
                          location: "Pune, India",
                          time: "3 days ago",
                          current: false,
                        },
                      ].map((session, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">{session.device}</p>
                            <p className="text-xs text-muted-foreground">
                              {session.location} - {session.time}
                            </p>
                          </div>
                          {session.current && (
                            <Badge className="bg-green-100 text-green-700">
                              Current Session
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to receive updates and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Receive updates and alerts via email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, email: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Receive important alerts via SMS
                        </p>
                      </div>
                      <Switch
                        checked={notifications.sms}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, sms: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="font-medium">Case Updates</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified when there is an update on your case
                        </p>
                      </div>
                      <Switch
                        checked={notifications.caseUpdates}
                        onCheckedChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            caseUpdates: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <p className="font-medium">Newsletter</p>
                        <p className="text-sm text-muted-foreground">
                          Receive news and updates about portal features
                        </p>
                      </div>
                      <Switch
                        checked={notifications.newsletter}
                        onCheckedChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            newsletter: checked,
                          })
                        }
                      />
                    </div>
                  </div>

                  <Button>Save Preferences</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
