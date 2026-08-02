"use client";

import React, { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Shield,
  Eye,
  EyeOff,
  Phone,
  Mail,
  User,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  Lock,
  Smartphone,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  type UserRole,
} from "@/lib/security";
import { completeLogin as login, useAuth, type User as AuthUser } from "@/lib/auth-store";

interface StoredUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  aadhaar?: string;
  role: UserRole;
  mfaEnabled: boolean;
  mfaSecret?: string;
  tempToken?: string;
  policeStation?: string;
  badgeNumber?: string;
  createdAt: string;
}

interface RawUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  aadhaar?: string;
  role: UserRole;
  mfaEnabled?: boolean;
  policeStation?: string;
  badgeNumber?: string;
  accountStatus: AuthUser["accountStatus"];
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated, user, mfaVerified } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [regStep, setRegStep] = useState<"details" | "verify" | "mfa-setup" | "complete">("details");
  const [regMfaQrCode, setRegMfaQrCode] = useState("");
  const [regMfaManualKey, setRegMfaManualKey] = useState("");
  const [regMfaSecret, setRegMfaSecret] = useState("");
  const [regMfaCode, setRegMfaCode] = useState("");
  const [regRecoveryCodes, setRegRecoveryCodes] = useState<string[]>([]);
  const [aadhaarOtp, setAadhaarOtp] = useState("");

  const [loginStep, setLoginStep] = useState<"credentials" | "mfa" | "mfa-setup">("credentials");
  const [pendingUser, setPendingUser] = useState<StoredUser | null>(null);
  const [loginMfaCode, setLoginMfaCode] = useState("");
  const [setupMfaCode, setSetupMfaCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    aadhaar: "",
    password: "",
    confirmPassword: "",
    role: "CITIZEN" as UserRole,
    policeStation: "",
    badgeNumber: "",
  });

  const [loginData, setLoginData] = useState({
    identifier: "",
    password: "",
  });

  // Real-time validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const newErrors: Record<string, string> = {};

    // Validate Password
    if (formData.password) {
      if (formData.password.length < 8) newErrors.password = "Min 8 chars";
      else if (!/[A-Z]/.test(formData.password)) newErrors.password = "Missing uppercase";
      else if (!/[0-9]/.test(formData.password)) newErrors.password = "Missing number";
      else if (!/[!@#$%^&*]/.test(formData.password)) newErrors.password = "Missing symbol";

      if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    // Validate Mobile
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Must be 10 digits";
    }

    // Validate Aadhaar (only if entered)
    if (formData.aadhaar && !/^\d{12}$/.test(formData.aadhaar.replace(/\s/g, ''))) {
      newErrors.aadhaar = "Must be 12 digits";
    }

    setErrors(newErrors);
  }, [formData]);

  const toAuthUser = (raw: RawUser): AuthUser => ({
    id: raw.id,
    name: raw.name,
    email: raw.email,
    mobile: raw.mobile,
    aadhaar: raw.aadhaar,
    role: raw.role,
    mfaEnabled: raw.mfaEnabled ?? false,
    policeStation: raw.policeStation,
    badgeNumber: raw.badgeNumber,
    accountStatus: raw.accountStatus,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
  });

  useEffect(() => {
    if (isAuthenticated && mfaVerified && user) {
      const redirectPath = user.role === "CITIZEN" ? "/dashboard" : user.role === "ADMIN" ? "/admin" : "/police";
      router.push(redirectPath);
    }
  }, [isAuthenticated, mfaVerified, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginData.identifier,
          password: loginData.password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Case 1: MFA Setup Required (New User or Force Setup)
      if (data.requiresMfaSetup) {
        setPendingUser({ ...data, tempToken: data.tempToken });

        // Initiate MFA setup to get QR code
        const setupRes = await fetch('/api/auth/setup-mfa', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${data.tempToken}`
          }
        });

        const setupData = await setupRes.json();
        if (!setupRes.ok) throw new Error(setupData.error || 'Failed to start MFA setup');

        setQrCodeUrl(setupData.qrCode);
        setManualKey(setupData.manualEntryKey);
        setLoginStep("mfa-setup");
        setIsLoading(false);
        return;
      }

      // Case 2: MFA Verification Required (Existing User)
      if (data.requiresMfa || data.mfaEnabled) {
        setPendingUser({ ...data, tempToken: data.tempToken });
        setLoginStep("mfa");
        setIsLoading(false);
        return;
      }

      // Case 3: Direct Login (Legacy/Fallback)
      const rawUser = data.user || data;
      const authUser = toAuthUser(rawUser);

      login(authUser, data.accessToken);
      const redirectPath = authUser.role === "CITIZEN" ? "/dashboard" : authUser.role === "ADMIN" ? "/admin" : "/police";
      router.push(redirectPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    }

    setIsLoading(false);
  };

  const handleMFAVerify = async () => {
    if (!pendingUser || !pendingUser.tempToken) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch('/api/auth/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken: pendingUser.tempToken,
          totp: loginMfaCode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid MFA code. Please try again.');
      }

      const verifiedUser = data.user || pendingUser;
      const authUser = toAuthUser(verifiedUser);

      login(authUser, data.accessToken);
      const redirectPath = authUser.role === "CITIZEN" ? "/dashboard" : authUser.role === "ADMIN" ? "/admin" : "/police";
      router.push(redirectPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "MFA verification failed. Please try again.");
    }

    setIsLoading(false);
  };

  const handleMFASetupVerify = async () => {
    if (!pendingUser || !pendingUser.tempToken) return;

    setIsLoading(true);
    setError("");

    try {
      // 1. Verify TOTP Setup
      const res = await fetch('/api/auth/verify-totp-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pendingUser.tempToken}`
        },
        body: JSON.stringify({
          totp: setupMfaCode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid code. Please try again.');
      }

      setRecoveryCodes(data.recoveryCodes || []);
      setSuccess("MFA Setup Complete! Please save your recovery codes.");
      setLoginStep("mfa-setup"); // Stay on this step to show recovery codes, handled in render

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "MFA setup failed. Please try again.");
    }

    setIsLoading(false);
  };

  const handleSendAadhaarOTP = async () => {
    if (!formData.aadhaar || formData.aadhaar.length < 12) {
      setError("Please enter a valid Aadhaar number");
      return;
    }

    if (!formData.email) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch('/api/auth/aadhaar/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaar: formData.aadhaar,
          email: formData.email,
          name: formData.name || "Citizen",
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send OTP');
      }

      setRegStep("verify");
      setSuccess("OTP sent to your email address");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    }

    setIsLoading(false);
  };

  const handleVerifyAadhaarOTP = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (aadhaarOtp.length !== 6) {
        setError("Invalid OTP. Please enter 6 digits.");
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/auth/aadhaar/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaar: formData.aadhaar,
          email: formData.email,
          otp: aadhaarOtp,
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'OTP verification failed');
      }

      // Aadhaar verified - now setup MFA before creating account
      const mfaSetupRes = await fetch('/api/auth/setup-mfa-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
        })
      });

      if (!mfaSetupRes.ok) {
        const data = await mfaSetupRes.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to setup MFA');
      }

      const mfaData = await mfaSetupRes.json();
      setRegMfaQrCode(mfaData.qrCode);
      setRegMfaManualKey(mfaData.manualEntryKey);
      setRegMfaSecret(mfaData.secret);
      setRegStep("mfa-setup");
      setSuccess("Scan QR code with Google Authenticator");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Aadhaar verification failed");
    }

    setIsLoading(false);
  };

  const handleCompleteMfaSetup = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (regMfaCode.length !== 6) {
        setError("Please enter 6-digit code from Google Authenticator");
        setIsLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      // Ensure no blocking errors before proceeding
      if (Object.keys(errors).length > 0) {
        setError("Please fix the errors in the form before proceeding.");
        setIsLoading(false);
        return;
      }


      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          aadhaar: formData.aadhaar,
          password: formData.password,
          role: formData.role,
          policeStation: formData.policeStation || undefined,
          badgeNumber: formData.badgeNumber || undefined,
          mfaSecret: regMfaSecret,
          totp: regMfaCode,
        }),
      });

      if (!registerRes.ok) {
        const data = await registerRes.json().catch(() => ({}));
        const errorMessage = data.error || 'Registration failed';

        if (registerRes.status === 409) {
          setError(errorMessage + '. Please use the login tab instead.');
          setIsLoading(false);
          return;
        }

        throw new Error(errorMessage);
      }

      const regData = await registerRes.json();
      setRegRecoveryCodes(regData.recoveryCodes || []);
      setRegStep("complete");
      setSuccess("Account created successfully with MFA enabled");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }

    setIsLoading(false);
  };

  const handleCompleteRegistration = async () => {
    setLoginStep("credentials");
    window.location.reload();
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
                Ministry of Home Affairs
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

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-lg border-border shadow-lg">
          <CardHeader className="border-b border-border bg-primary/5 text-center">
            <CardTitle className="text-2xl">
              {loginStep === "mfa" ? "Two-Factor Authentication" :
                loginStep === "mfa-setup" ? "Setup Authenticator" :
                  "Citizen Portal"}
            </CardTitle>
            <CardDescription>
              {loginStep === "mfa"
                ? "Enter the 6-digit code from your authenticator app"
                : loginStep === "mfa-setup"
                  ? "Secure your account with Google Authenticator"
                  : "File and track FIRs online"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                {success}
              </div>
            )}

            {/* MFA Setup Step */}
            {loginStep === "mfa-setup" && (
              <div className="space-y-6">
                {!recoveryCodes.length ? (
                  <>
                    <div className="flex flex-col items-center space-y-4">
                      {qrCodeUrl && (
                        <div className="rounded-lg border bg-white p-2">
                          {/* Use img tag for data URI */}
                          <img src={qrCodeUrl} alt="MFA QR Code" width={200} height={200} />
                        </div>
                      )}
                      <div className="text-center text-sm text-muted-foreground">
                        <p>Scan this QR code with Google Authenticator</p>
                        {manualKey && (
                          <p className="mt-2 text-xs font-mono bg-muted p-1 rounded">
                            Key: {manualKey}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-center">
                      <Label>Enter the 6-digit code generated by the app</Label>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={setupMfaCode}
                          onChange={setSetupMfaCode}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleMFASetupVerify}
                      disabled={isLoading || setupMfaCode.length !== 6}
                    >
                      {isLoading ? "Verifying..." : "Verify & Enable MFA"}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2">Save these recovery codes!</h4>
                      <p className="text-sm text-yellow-700 mb-4">
                        If you lose your device, these codes are the only way to access your account.
                      </p>
                      <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-white p-2 rounded border">
                        {recoveryCodes.map((code, i) => (
                          <div key={i} className="p-1">{code}</div>
                        ))}
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setLoginStep("credentials");
                        setSuccess("MFA setup complete. Please log in.");
                        setPendingUser(null);
                        setRecoveryCodes([]);
                        setQrCodeUrl("");
                      }}
                    >
                      Return to Login
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* MFA Verification for Login */}
            {loginStep === "mfa" && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <Smartphone className="h-10 w-10 text-primary" />
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <Label>Enter your 6-digit authentication code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={loginMfaCode}
                      onChange={setLoginMfaCode}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleMFAVerify}
                  disabled={isLoading || loginMfaCode.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Verify & Sign In
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setLoginStep("credentials");
                    setPendingUser(null);
                    setLoginMfaCode("");
                    setError("");
                  }}
                >
                  Back to Login
                </Button>
              </div>
            )}

            {/* Login/Register Tabs */}
            {loginStep === "credentials" && (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-identifier">Mobile / Email / Aadhaar</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-identifier"
                          placeholder="Enter mobile, email, or Aadhaar"
                          className="pl-10"
                          value={loginData.identifier}
                          onChange={(e) =>
                            setLoginData({ ...loginData, identifier: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData({ ...loginData, password: e.target.value })
                          }
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>

                  <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">Secure Login with MFA</p>
                        <p>
                          All accounts are protected with Two-Factor Authentication.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register">
                  {regStep === "details" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Registering as</Label>
                        <Select disabled defaultValue="CITIZEN">
                          <SelectTrigger>
                            <SelectValue placeholder="Citizen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CITIZEN">Citizen</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[0.8rem] text-muted-foreground">
                          Note: Police/Admin accounts are created by administrators.
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="reg-name">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="reg-name"
                              placeholder="Enter full name"
                              className="pl-10"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                              }
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-mobile" className={errors.mobile ? "text-red-500" : ""}>Mobile Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="reg-mobile"
                              placeholder="+91 XXXXX XXXXX"
                              className={`pl-10 ${errors.mobile ? "border-red-500 bg-red-50" : ""}`}
                              value={formData.mobile}
                              onChange={(e) =>
                                setFormData({ ...formData, mobile: e.target.value })
                              }
                              required
                            />
                          </div>
                          {errors.mobile && <p className="text-xs text-red-500">{errors.mobile}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-email" className={errors.email ? "text-red-500" : ""}>Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="your@email.com"
                            className={`pl-10 ${errors.email ? "border-red-500 bg-red-50" : ""}`}
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            required
                          />
                        </div>
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                      </div>

                      {(formData.role === "OFFICER" || formData.role === "ADMIN") && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="police-station">Police Station</Label>
                            <Input
                              id="police-station"
                              placeholder="Station name"
                              value={formData.policeStation}
                              onChange={(e) =>
                                setFormData({ ...formData, policeStation: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="badge-number">Badge Number</Label>
                            <Input
                              id="badge-number"
                              placeholder="Badge/ID number"
                              value={formData.badgeNumber}
                              onChange={(e) =>
                                setFormData({ ...formData, badgeNumber: e.target.value })
                              }
                              required
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="reg-aadhaar" className={errors.aadhaar ? "text-red-500" : ""}>Aadhaar Number</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="reg-aadhaar"
                            placeholder="XXXX XXXX XXXX"
                            className={`pl-10 ${errors.aadhaar ? "border-red-500 bg-red-50" : ""}`}
                            value={formData.aadhaar}
                            onChange={(e) =>
                              setFormData({ ...formData, aadhaar: e.target.value })
                            }
                            required
                          />
                        </div>
                        {errors.aadhaar && <p className="text-xs text-red-500">{errors.aadhaar}</p>}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="reg-password" className={errors.password ? "text-red-500" : ""}>Create Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="reg-password"
                              type={showRegPassword ? "text" : "password"}
                              placeholder="Min 8 characters"
                              className={`pl-10 pr-10 ${errors.password ? "border-red-500 bg-red-50" : ""}`}
                              value={formData.password}
                              onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                              }
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showRegPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password" className={errors.confirmPassword ? "text-red-500" : ""}>Confirm Password</Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showRegConfirmPassword ? "text" : "password"}
                              placeholder="Re-enter password"
                              className={`pr-10 ${errors.confirmPassword ? "border-red-500 bg-red-50" : ""}`}
                              value={formData.confirmPassword}
                              onChange={(e) =>
                                setFormData({ ...formData, confirmPassword: e.target.value })
                              }
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showRegConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                        </div>
                      </div>

                      {/* Password Requirements - Realtime Feedback */}
                      {formData.password && (
                        <div className="rounded-lg bg-muted/50 p-3 text-xs">
                          <p className="mb-2 font-medium">Password must have:</p>
                          <ul className="space-y-1">
                            <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? "text-green-600" : "text-muted-foreground"}`}>
                              {formData.password.length >= 8 ? <CheckCircle className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                              At least 8 characters
                            </li>
                            <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? "text-green-600" : "text-muted-foreground"}`}>
                              {/[A-Z]/.test(formData.password) ? <CheckCircle className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                              One uppercase letter
                            </li>
                            <li className={`flex items-center gap-2 ${/[0-9]/.test(formData.password) ? "text-green-600" : "text-muted-foreground"}`}>
                              {/[0-9]/.test(formData.password) ? <CheckCircle className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                              One number
                            </li>
                            <li className={`flex items-center gap-2 ${/[!@#$%^&*]/.test(formData.password) ? "text-green-600" : "text-muted-foreground"}`}>
                              {/[!@#$%^&*]/.test(formData.password) ? <CheckCircle className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                              One special character
                            </li>
                          </ul>
                        </div>
                      )}

                      <Button
                        type="button"
                        className="w-full"
                        onClick={handleSendAadhaarOTP}
                        disabled={
                          isLoading ||
                          !formData.name ||
                          !formData.email ||
                          !formData.mobile ||
                          !formData.aadhaar ||
                          !formData.password ||
                          !formData.confirmPassword ||
                          String(Object.keys(errors).length) !== "0"
                        }
                      >
                        {isLoading ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Sending OTP...
                          </>
                        ) : Object.keys(errors).length > 0 ? (
                          "Fix Errors to Continue"
                        ) : (
                          "Verify Aadhaar & Continue"
                        )}
                      </Button>
                    </div>
                  )}

                  {regStep === "verify" && (
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                          <Phone className="h-8 w-8 text-primary" />
                        </div>
                      </div>

                      <div className="text-center">
                        <h3 className="font-semibold">Verify Aadhaar</h3>
                        <p className="text-sm text-muted-foreground">
                          Enter the OTP sent to your email address
                        </p>
                      </div>

                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={aadhaarOtp}
                          onChange={setAadhaarOtp}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleVerifyAadhaarOTP}
                        disabled={isLoading || aadhaarOtp.length !== 6}
                      >
                        {isLoading ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Verifying...
                          </>
                        ) : (
                          "Verify OTP"
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          setRegStep("details");
                          setAadhaarOtp("");
                          setError("");
                          setSuccess("");
                        }}
                      >
                        Back
                      </Button>
                    </div>
                  )}

                  {regStep === "mfa-setup" && (
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                          <Smartphone className="h-10 w-10 text-primary" />
                        </div>
                      </div>

                      <div className="text-center">
                        <h3 className="font-semibold">Setup Google Authenticator</h3>
                        <p className="text-sm text-muted-foreground">
                          Scan the QR code below with Google Authenticator app
                        </p>
                      </div>

                      {regMfaQrCode && (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="rounded-lg border bg-white p-4">
                            <img src={regMfaQrCode} alt="MFA QR Code" width={200} height={200} />
                          </div>
                          {regMfaManualKey && (
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">Manual Entry Key:</p>
                              <p className="text-xs font-mono bg-muted p-2 rounded">{regMfaManualKey}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2 text-center">
                        <Label>Enter 6-digit code from Google Authenticator</Label>
                        <div className="flex justify-center">
                          <InputOTP
                            maxLength={6}
                            value={regMfaCode}
                            onChange={setRegMfaCode}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <Button
                          onClick={handleCompleteMfaSetup}
                          className="w-full"
                          disabled={isLoading || regMfaCode.length !== 6}
                        >
                          {isLoading ? (
                            <>
                              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Creating Account...
                            </>
                          ) : (
                            "Verify & Create Account"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setRegStep("verify");
                            setRegMfaCode("");
                            setError("");
                          }}
                          disabled={isLoading}
                        >
                          Back
                        </Button>
                      </div>
                    </div>
                  )}

                  {regStep === "complete" && (
                    <div className="space-y-6 text-center">
                      <div className="flex justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                          <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          Account Created Successfully!
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Your account has been secured with Two-Factor Authentication.
                        </p>
                      </div>

                      {regRecoveryCodes.length > 0 && (
                        <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200 text-left">
                          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Save Your Recovery Codes
                          </h4>
                          <p className="text-sm text-yellow-700 mb-3">
                            Store these codes in a safe place. You&apos;ll need them to access your account if you lose your device.
                          </p>
                          <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-white p-3 rounded border">
                            {regRecoveryCodes.map((code, i) => (
                              <div key={i} className="p-1">{code}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="rounded-lg border border-border bg-muted/50 p-4 text-left">
                        <h4 className="mb-2 font-medium">Account Details:</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>
                            <span className="font-medium">Name:</span> {formData.name}
                          </li>
                          <li>
                            <span className="font-medium">Email:</span> {formData.email}
                          </li>
                          <li>
                            <span className="font-medium">Role:</span>{" "}
                            {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                          </li>
                          <li>
                            <span className="font-medium">MFA:</span> Enabled ✓
                          </li>
                        </ul>
                      </div>

                      <Button className="w-full" onClick={handleCompleteRegistration}>
                        Continue to Login
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4 text-center text-sm text-muted-foreground">
        <p>National Emergency Number: 112 | Women Helpline: 181</p>
      </footer>
    </div>
  );
}
