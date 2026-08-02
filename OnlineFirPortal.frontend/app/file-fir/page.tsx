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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  User,
  FileText,
  MapPin,
  Upload,
  CheckCircle,
  AlertTriangle,
  X,
  Download,
  Printer,
  Lock,
  ShieldCheck,
  Save,
} from "lucide-react";
import { getAuthState, type User as AuthUser } from "@/lib/auth-store";
import { generateRSASigningKeyPair, signData, encodeBase64 } from "@/lib/security";
import type { FIR } from "@/lib/fir-store";
import { EvidenceUpload, type FileWithPreview } from "@/components/ui/evidence-upload";
import { useAutoSave } from "@/lib/use-auto-save";
import { validateAadhaar, validateMobile, validateEmail } from "@/lib/form-validation";
import { toast } from "sonner";


const SIGNING_KEY_STORAGE_KEY = "fir-signing-keypair-v1";

const steps = [
  { id: 1, title: "Personal Details", icon: User },
  { id: 2, title: "Incident Details", icon: FileText },
  { id: 3, title: "Location & Witnesses", icon: MapPin },
  { id: 4, title: "Evidence & Documents", icon: Upload },
  { id: 5, title: "Review & Submit", icon: CheckCircle },
];

const complaintTypes = [
  { value: "Theft / Robbery", label: "Theft / Robbery", description: "Stolen property, burglary, pickpocketing" },
  { value: "Cyber Crime", label: "Cyber Crime", description: "Online fraud, hacking, phishing" },
  { value: "Vehicle Theft", label: "Vehicle Theft", description: "Two-wheeler, four-wheeler, or other vehicle theft" },
  { value: "Missing Person", label: "Missing Person", description: "Report a missing family member or person" },
  { value: "Assault / Violence", label: "Assault / Violence", description: "Physical attack, domestic violence" },
  { value: "Fraud / Cheating", label: "Fraud / Cheating", description: "Financial fraud, cheating, forgery" },
  { value: "Lost Property", label: "Lost Property", description: "Lost documents, valuables, or items" },
  { value: "Other", label: "Other", description: "Any other complaint" },
];

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh",
];

export default function FileFIRPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFIR, setSubmittedFIR] = useState<FIR | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    aadhaar: "",
    address: "",
    complaintType: "",
    incidentDate: "",
    incidentTime: "",
    description: "",
    state: "",
    district: "",
    incidentPlace: "",
    nearestLandmark: "",
    hasWitness: "no",
    witnessName: "",
    witnessContact: "",
    declaration: false,
  });

  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save hook
  const { lastSaved, isDirty, clearDraft, restoreDraft } = useAutoSave(formData, {
    key: 'fir-draft-v1',
    debounceMs: 2000,
    onSave: () => {
      // Optional: Show subtle save indicator
      console.log('Draft saved');
    },
  });

  useEffect(() => {
    const authState = getAuthState();
    if (!authState.isAuthenticated || !authState.mfaVerified) {
      router.push("/auth");
      return;
    }

    if (authState.user?.role !== "CITIZEN") {
      router.push("/police");
      return;
    }

    setUser(authState.user);

    // Try to restore draft first
    const draft = restoreDraft();
    if (draft && Object.keys(draft).length > 0) {
      // Ask user if they want to restore
      const shouldRestore = confirm('You have an unsaved draft. Would you like to continue where you left off?');
      if (shouldRestore) {
        setFormData(draft);
        toast.success('Draft restored');
        return;
      } else {
        clearDraft();
      }
    }

    // Pre-fill user data if no draft
    if (authState.user) {
      setFormData((prev) => ({
        ...prev,
        fullName: authState.user?.name || "",
        mobile: authState.user?.mobile || "",
        email: authState.user?.email || "",
        aadhaar: authState.user?.aadhaar || "",
      }));
    }
  }, [router]);

  // Real-time validation
  const validateField = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'aadhaar':
        const aadhaarResult = validateAadhaar(value);
        error = aadhaarResult.error || '';
        break;
      case 'mobile':
      case 'witnessContact':
        const mobileResult = validateMobile(value);
        error = mobileResult.error || '';
        break;
      case 'email':
        const emailResult = validateEmail(value);
        error = emailResult.error || '';
        if (emailResult.suggestion) {
          toast.info(emailResult.suggestion);
        }
        break;
      case 'description':
        if (value.length < 50) {
          error = `Description must be at least 50 characters (${value.length}/50)`;
        }
        break;
    }

    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate on change
    if (typeof value === 'string') {
      validateField(field, value);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // 1. Get or create a persistent signing keypair for this user
      const storedKeysRaw = typeof window !== "undefined" ? localStorage.getItem(SIGNING_KEY_STORAGE_KEY) : null;
      let keys: { publicKey: string; privateKey: string } | null = null;

      if (storedKeysRaw) {
        try { keys = JSON.parse(storedKeysRaw); } catch { keys = null; }
      }

      if (!keys) {
        keys = await generateRSASigningKeyPair();
        localStorage.setItem(SIGNING_KEY_STORAGE_KEY, JSON.stringify(keys));
      }

      // 2. Register public key with backend
      const token = typeof window !== 'undefined' ? localStorage.getItem('online_fir_auth_state') : null;
      const parsedAuth = token ? JSON.parse(token) : null;
      const accessToken = parsedAuth?.accessToken || '';
      await fetch('/api/auth/register-public-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ publicKey: keys.publicKey }),
      }).catch(() => { });

      // 3. Create Payload — sign the core FIR data that the backend will also reconstruct
      const signaturePayload = {
        reporterId: user.id,
        complaintType: formData.complaintType,
        incidentDate: formData.incidentDate,
        incidentPlace: formData.incidentPlace,
        description: formData.description,
      };
      const dataToSign = JSON.stringify(signaturePayload);
      const signature = await signData(dataToSign, keys.privateKey);

      const payload = {
        complainantId: user.id,
        complainantName: formData.fullName,
        complainantMobile: formData.mobile,
        complainantEmail: formData.email,
        complainantAadhaar: formData.aadhaar,
        complainantAddress: formData.address,
        complaintType: formData.complaintType,
        incidentDate: formData.incidentDate,
        incidentTime: formData.incidentTime,
        incidentDescription: formData.description,
        incidentState: formData.state,
        incidentDistrict: formData.district,
        incidentPlace: formData.incidentPlace,
        nearestLandmark: formData.nearestLandmark,
        hasWitness: formData.hasWitness === "yes",
        witnessName: formData.witnessName,
        witnessContact: formData.witnessContact,
        signature: signature,
        signaturePublicKey: keys.publicKey,
        signatureData: dataToSign,
        signatureAlgo: "RSA-PSS-SHA256",
      };

      // 4. Create FIR
      const res = await fetch('/api/firs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Server responded ${res.status}`);
      }

      const created = await res.json();

      // 5. Upload Documents
      if (uploadedFiles.length > 0) {
        setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'uploading', progress: 0 })));
        const failedUploads: string[] = [];

        for (let i = 0; i < uploadedFiles.length; i++) {
          const fileItem = uploadedFiles[i];
          try {
            const content = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(fileItem.file);
            });

            const upRes = await fetch('/api/documents/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
              },
              credentials: 'include',
              body: JSON.stringify({
                firId: created.id,
                filename: fileItem.file.name,
                mimetype: fileItem.file.type,
                size: fileItem.file.size,
                documentType: 'EVIDENCE',
                content,
              })
            });

            if (upRes.ok) {
              setUploadedFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'completed', progress: 100 } : f));
            } else {
              const err = await upRes.json().catch(() => ({}));
              const message = err?.error || `Upload failed (${upRes.status})`;
              setUploadedFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: 'Upload failed' } : f));
              failedUploads.push(`${fileItem.file.name}: ${message}`);
            }
          } catch (e) {
            setUploadedFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: 'Network error' } : f));
            failedUploads.push(`${fileItem.file.name}: Network error`);
          }
        }

        if (failedUploads.length > 0) {
          alert(`FIR created, but some documents failed to upload:\n\n${failedUploads.join('\n')}`);
        }
      }

      setSubmittedFIR(created);
    } catch (e: unknown) {
      alert(`Submission failed: ${e instanceof Error ? e.message : "An unknown error occurred"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const formatFirReceipt = (fir: FIR) => {
    const lines = [
      'Online FIR Portal - FIR Receipt',
      '--------------------------------',
      `Reference Number: ${fir.referenceNumber}`,
      `Status: ${fir.status ?? 'pending'}`,
      `Complaint Type: ${fir.crimeType ?? 'N/A'}`,
      `Incident Date: ${fir.incidentDate ?? 'N/A'}`,
      `Incident Time: ${fir.incidentTime ?? 'N/A'}`,
      `Incident Place: ${fir.incidentPlace ?? 'N/A'}`,
      `District: ${fir.incidentDistrict ?? 'N/A'}`,
      `State: ${fir.incidentState ?? 'N/A'}`,
      `Filed By: ${fir.reporter?.name ?? 'N/A'}`,
      `Created At: ${fir.createdAt ?? 'N/A'}`,
      '',
      'Description:',
      `${fir.description ?? 'N/A'}`,
    ];
    return lines.join('\n');
  };

  const handleDownloadReceipt = (fir: FIR) => {
    const content = formatFirReceipt(fir);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fir.referenceNumber || 'fir-receipt'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = (fir: FIR) => {
    const content = formatFirReceipt(fir).replace(/\n/g, '<br/>');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>FIR Receipt - ${fir.referenceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 20px; margin-bottom: 12px; }
            .meta { margin-bottom: 16px; }
            .box { border: 1px solid #ddd; padding: 16px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>Online FIR Portal - FIR Receipt</h1>
          <div class="box">${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (submittedFIR) {
    const qrData = encodeBase64(JSON.stringify({
      ref: submittedFIR.referenceNumber,
      type: submittedFIR.crimeType,
      date: submittedFIR.createdAt,
    }));

    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                Online FIR Portal
              </span>
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-border shadow-lg">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-foreground">
                FIR Submitted Successfully!
              </h2>
              <p className="mb-2 text-muted-foreground">
                Your FIR has been registered with reference number:
              </p>
              <p className="mb-6 text-2xl font-bold text-primary">
                {submittedFIR.referenceNumber}
              </p>

              <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="text-sm text-foreground">
                  Digitally signed and encrypted
                </span>
              </div>

              <div className="mb-8 w-full rounded-lg border border-border bg-muted/50 p-4 text-left">
                <h4 className="mb-3 font-semibold text-foreground">
                  What happens next?
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    Your FIR will be reviewed by the concerned police station
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    You will receive SMS/email updates on case progress
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    An investigating officer will be assigned within 24-48 hours
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    You may be contacted for additional information if needed
                  </li>
                </ul>
              </div>

              <div className="mb-6 rounded-lg border border-border bg-card p-4">
                <p className="mb-2 text-xs text-muted-foreground">
                  QR Code Data (Base64 Encoded)
                </p>
                <code className="break-all text-xs text-foreground">{qrData.substring(0, 50)}...</code>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <Button className="gap-2" onClick={() => handleDownloadReceipt(submittedFIR)}>
                  <Download className="h-4 w-4" />
                  Download FIR Copy
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent" onClick={() => handlePrintReceipt(submittedFIR)}>
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </Button>
                <Button variant="outline" className="bg-transparent" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
              <span className="text-xs text-muted-foreground">File New FIR</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 sm:flex">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-xs text-foreground">Secure & Encrypted</span>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div key={step.id} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${isCompleted
                          ? "border-primary bg-primary text-primary-foreground"
                          : isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground"
                          }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                      <span
                        className={`mt-2 hidden text-xs sm:block ${isActive ? "font-medium text-primary" : "text-muted-foreground"
                          }`}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`mx-2 h-1 flex-1 rounded ${currentStep > step.id ? "bg-primary" : "bg-border"
                          }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          <Card className="mx-auto max-w-3xl border-border shadow-lg">
            <CardHeader className="border-b border-border bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                {(() => {
                  const StepIcon = steps[currentStep - 1].icon;
                  return <StepIcon className="h-5 w-5 text-primary" />;
                })()}
                Step {currentStep}: {steps[currentStep - 1].title}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Your details are pre-filled from your account"}
                {currentStep === 2 && "Describe the incident in detail"}
                {currentStep === 3 && "Specify the location and any witnesses"}
                {currentStep === 4 && "Upload supporting documents and evidence"}
                {currentStep === 5 && "Review your information before submitting"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {/* Step 1: Personal Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Your details are pre-filled from your verified account
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => updateFormData("fullName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={formData.mobile}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (!val.startsWith("+91")) {
                            val = "+91 " + val.replace(/\D/g, '');
                          } else {
                            // Allow only numbers after +91
                            const numberPart = val.substring(3).replace(/\D/g, '');
                            val = "+91 " + numberPart;
                          }
                          // Limit length (10 digits + space + +91) -> 14 chars
                          if (val.length <= 14) {
                            updateFormData("mobile", val)
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aadhaar">Aadhaar Number (Verified)</Label>
                      <Input
                        id="aadhaar"
                        placeholder="XXXX XXXX XXXX"
                        value={formData.aadhaar}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Residential Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter your complete residential address"
                      value={formData.address}
                      onChange={(e) => updateFormData("address", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Incident Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label>Type of Complaint</Label>
                    <RadioGroup
                      value={formData.complaintType}
                      onValueChange={(val) => updateFormData("complaintType", val)}
                      className="grid gap-3 sm:grid-cols-2"
                    >
                      {complaintTypes.map((type) => (
                        <div key={type.value} className="relative">
                          <RadioGroupItem
                            value={type.value}
                            id={type.value}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={type.value}
                            className="flex cursor-pointer flex-col rounded-lg border-2 border-border p-4 transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                          >
                            <span className="font-medium">{type.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {type.description}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="incidentDate">Date of Incident</Label>
                      <Input
                        id="incidentDate"
                        type="date"
                        value={formData.incidentDate}
                        onChange={(e) => updateFormData("incidentDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incidentTime">Time of Incident (approx.)</Label>
                      <Input
                        id="incidentTime"
                        type="time"
                        value={formData.incidentTime}
                        onChange={(e) => updateFormData("incidentTime", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide a detailed description of the incident. Include what happened, how it happened, and any other relevant information."
                      className="min-h-[150px]"
                      value={formData.description}
                      onChange={(e) => updateFormData("description", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/100 characters minimum
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Location & Witnesses */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="state">State/UT</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(val) => updateFormData("state", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">District</Label>
                      <Input
                        id="district"
                        placeholder="Enter district name"
                        value={formData.district}
                        onChange={(e) => updateFormData("district", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incidentPlace">Place of Incident</Label>
                    <Textarea
                      id="incidentPlace"
                      placeholder="Enter the complete address/location where the incident occurred"
                      value={formData.incidentPlace}
                      onChange={(e) => updateFormData("incidentPlace", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nearestLandmark">Nearest Landmark</Label>
                    <Input
                      id="nearestLandmark"
                      placeholder="Enter nearest landmark"
                      value={formData.nearestLandmark}
                      onChange={(e) => updateFormData("nearestLandmark", e.target.value)}
                    />
                  </div>

                  <div className="space-y-4 rounded-lg border border-border p-4">
                    <div className="space-y-2">
                      <Label>Do you have any witness?</Label>
                      <RadioGroup
                        value={formData.hasWitness}
                        onValueChange={(val) => updateFormData("hasWitness", val)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="yes" id="witness-yes" />
                          <Label htmlFor="witness-yes">Yes</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="witness-no" />
                          <Label htmlFor="witness-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {formData.hasWitness === "yes" && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="witnessName">Witness Name</Label>
                          <Input
                            id="witnessName"
                            placeholder="Enter witness name"
                            value={formData.witnessName}
                            onChange={(e) => updateFormData("witnessName", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="witnessContact">Witness Contact</Label>
                          <Input
                            id="witnessContact"
                            type="text"
                            placeholder="Enter contact number"
                            value={formData.witnessContact}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*$/.test(val) && val.length <= 10) {
                                updateFormData("witnessContact", val)
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Evidence & Documents */}
              {/* Step 4: Evidence & Documents */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="rounded-lg border bg-card p-4">
                    <h4 className="mb-2 font-semibold">Upload Evidence Documents</h4>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Please upload any supporting documents, photos, or videos.
                      These will be digitally signed and encrypted.
                    </p>
                    <EvidenceUpload
                      files={uploadedFiles}
                      onFilesChange={setUploadedFiles}
                      maxSizeMB={10} // 10MB limit per file
                      maxFiles={10}
                    />
                  </div>
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>
                        Note: All uploaded documents serve as legal evidence. Do not upload falsified or irrelevant documents.
                        Files are securely encrypted ensuring chain-of-custody.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review & Submit */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                      <h4 className="mb-3 font-semibold text-foreground">Personal Details</h4>
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <div><span className="text-muted-foreground">Name:</span> {formData.fullName}</div>
                        <div><span className="text-muted-foreground">Mobile:</span> {formData.mobile}</div>
                        <div><span className="text-muted-foreground">Email:</span> {formData.email}</div>
                        <div><span className="text-muted-foreground">Aadhaar:</span> ****{formData.aadhaar.slice(-4)}</div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                      <h4 className="mb-3 font-semibold text-foreground">Incident Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-muted-foreground">Type:</span> {formData.complaintType}</div>
                        <div><span className="text-muted-foreground">Date:</span> {formData.incidentDate}</div>
                        <div><span className="text-muted-foreground">Location:</span> {formData.incidentPlace}, {formData.district}, {formData.state}</div>
                        <div><span className="text-muted-foreground">Description:</span> {formData.description.substring(0, 100)}...</div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                      <h4 className="mb-3 font-semibold text-foreground">Documents</h4>
                      <p className="text-sm">
                        {uploadedFiles.length > 0
                          ? `${uploadedFiles.length} file(s) uploaded`
                          : "No documents uploaded"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                    <Checkbox
                      id="declaration"
                      checked={formData.declaration}
                      onCheckedChange={(checked) =>
                        updateFormData("declaration", checked === true)
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor="declaration" className="cursor-pointer font-medium">
                        Declaration
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I hereby declare that the information provided above is true and
                        correct to the best of my knowledge. I understand that filing a
                        false FIR is a punishable offense under IPC Section 182.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <Lock className="h-5 w-5 text-primary" />
                    <span className="text-sm text-foreground">
                      Your FIR will be digitally signed and encrypted before submission
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="gap-2 bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                {currentStep < 5 ? (
                  <Button onClick={nextStep} className="gap-2">
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.declaration}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Submit FIR
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div >
      </main >
    </div >
  );
}
