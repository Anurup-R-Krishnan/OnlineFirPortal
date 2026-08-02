import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, ArrowLeft, FileText, AlertCircle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Online FIR Portal</h1>
                <p className="text-xs text-muted-foreground">Government of India</p>
              </div>
            </Link>
            <Link href="/auth">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Terms and Conditions</h1>
              <p className="text-sm text-muted-foreground">
                Last updated: February 2, 2026
              </p>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <CardTitle>Important Notice</CardTitle>
              </div>
              <CardDescription>
                Please read these terms and conditions carefully before using the
                Online FIR Portal.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  By accessing and using the Online FIR Portal (&quot;the Portal&quot;), you
                  agree to be bound by these Terms and Conditions. If you do not
                  agree with any part of these terms, you must not use the Portal.
                </p>
                <p>
                  The Portal is operated by the Ministry of Home Affairs,
                  Government of India, and is designed to facilitate the filing and
                  tracking of First Information Reports (FIRs) online.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Eligibility and Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>2.1 Age Requirement:</strong> You must be at least 18
                  years of age to use this Portal. By registering, you confirm that
                  you meet this requirement.
                </p>
                <p>
                  <strong>2.2 Accurate Information:</strong> You must provide
                  accurate, current, and complete information during registration,
                  including your Aadhaar number, mobile number, and email address.
                </p>
                <p>
                  <strong>2.3 Account Security:</strong> You are responsible for
                  maintaining the confidentiality of your account credentials and
                  for all activities that occur under your account.
                </p>
                <p>
                  <strong>2.4 One Account Per Person:</strong> Each individual may
                  maintain only one account on the Portal.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Use of the Portal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>3.1 Permitted Use:</strong> The Portal is intended solely
                  for the purpose of filing genuine FIRs and tracking their status.
                </p>
                <p>
                  <strong>3.2 Prohibited Activities:</strong> You agree not to:
                </p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>File false, misleading, or frivolous complaints</li>
                  <li>Use the Portal for any unlawful purpose</li>
                  <li>
                    Attempt to gain unauthorized access to any part of the Portal
                  </li>
                  <li>
                    Upload or transmit viruses, malware, or other malicious code
                  </li>
                  <li>
                    Interfere with or disrupt the Portal or servers connected to it
                  </li>
                  <li>Impersonate any person or entity</li>
                  <li>Harvest or collect information about other users</li>
                </ul>
                <p>
                  <strong>3.3 Legal Consequences:</strong> Filing a false FIR is a
                  criminal offense under Section 182 of the Indian Penal Code and
                  may result in imprisonment and/or fine.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Data Collection and Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>4.1 Information Collection:</strong> We collect personal
                  information including but not limited to name, Aadhaar number,
                  mobile number, email address, and details of the incident
                  reported.
                </p>
                <p>
                  <strong>4.2 Use of Information:</strong> Your information will be
                  used for processing your FIR, investigation purposes, and
                  communication regarding your complaint.
                </p>
                <p>
                  <strong>4.3 Data Sharing:</strong> Your information may be shared
                  with relevant law enforcement agencies and authorities as required
                  for investigation and legal proceedings.
                </p>
                <p>
                  <strong>4.4 Data Security:</strong> We implement appropriate
                  security measures to protect your personal information, including
                  encryption and secure authentication.
                </p>
                <p>
                  For more details, please refer to our{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. FIR Filing and Processing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>5.1 Submission:</strong> Once submitted, your FIR will be
                  registered and assigned a unique reference number for tracking.
                </p>
                <p>
                  <strong>5.2 Review Process:</strong> All FIRs are subject to
                  review by authorized law enforcement personnel before formal
                  registration.
                </p>
                <p>
                  <strong>5.3 Status Updates:</strong> You can track the status of
                  your FIR using the reference number provided.
                </p>
                <p>
                  <strong>5.4 Documentation:</strong> You may be required to provide
                  additional documentation or visit the police station for further
                  proceedings.
                </p>
                <p>
                  <strong>5.5 No Guarantee:</strong> Filing an FIR through this
                  Portal does not guarantee investigation or arrest. The decision
                  lies with the law enforcement authorities.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Document Upload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>6.1 Accepted Formats:</strong> You may upload supporting
                  documents in PDF, DOC, DOCX, JPG, JPEG, or PNG format.
                </p>
                <p>
                  <strong>6.2 File Size Limit:</strong> Each file must not exceed
                  10 MB in size.
                </p>
                <p>
                  <strong>6.3 Content Restrictions:</strong> Do not upload documents
                  containing obscene, defamatory, or illegal content.
                </p>
                <p>
                  <strong>6.4 Authenticity:</strong> You certify that all documents
                  uploaded are genuine and have not been tampered with.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  All content on the Portal, including text, graphics, logos,
                  images, and software, is the property of the Government of India
                  and is protected by copyright and other intellectual property
                  laws.
                </p>
                <p>
                  You may not reproduce, distribute, modify, or create derivative
                  works from any content on the Portal without prior written
                  permission.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Disclaimer and Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>8.1 Service Availability:</strong> The Portal is provided
                  &quot;as is&quot; and &quot;as available.&quot; We do not guarantee uninterrupted or
                  error-free service.
                </p>
                <p>
                  <strong>8.2 No Warranty:</strong> We make no warranties,
                  expressed or implied, regarding the Portal&apos;s operation or the
                  information provided.
                </p>
                <p>
                  <strong>8.3 Limitation:</strong> To the maximum extent permitted
                  by law, we shall not be liable for any indirect, incidental,
                  special, or consequential damages arising from your use of the
                  Portal.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Termination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>9.1 User Termination:</strong> You may close your account
                  at any time by contacting support.
                </p>
                <p>
                  <strong>9.2 Our Rights:</strong> We reserve the right to suspend
                  or terminate your account if you violate these Terms and
                  Conditions or engage in fraudulent activity.
                </p>
                <p>
                  <strong>9.3 Effect of Termination:</strong> Upon termination, your
                  right to use the Portal will immediately cease. Submitted FIRs
                  will remain in the system for legal and record-keeping purposes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Amendments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  We reserve the right to modify these Terms and Conditions at any
                  time. Changes will be effective upon posting to the Portal.
                  Continued use of the Portal after changes constitutes acceptance
                  of the modified terms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Governing Law and Jurisdiction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  These Terms and Conditions shall be governed by and construed in
                  accordance with the laws of India. Any disputes arising from these
                  terms shall be subject to the exclusive jurisdiction of the courts
                  in New Delhi, India.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>12. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  For questions or concerns regarding these Terms and Conditions,
                  please contact:
                </p>
                <div className="rounded-lg bg-muted p-4">
                  <p className="font-semibold">Online FIR Portal Support</p>
                  <p>Ministry of Home Affairs</p>
                  <p>Government of India</p>
                  <p>Email: support@onlinefir.gov.in</p>
                  <p>Helpline: 1800-XXX-XXXX (Toll Free)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex gap-4">
            <Link href="/auth" className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
            <Link href="/privacy" className="flex-1">
              <Button className="w-full">
                View Privacy Policy
                <FileText className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border bg-muted/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Government of India. All rights reserved.</p>
          <p className="mt-2">
            An initiative by the Ministry of Home Affairs
          </p>
        </div>
      </footer>
    </div>
  );
}
