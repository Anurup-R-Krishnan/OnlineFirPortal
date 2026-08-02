import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, ArrowLeft, Lock, AlertCircle, Eye, Database, UserCheck, FileKey } from "lucide-react";

export default function PrivacyPage() {
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
            <Lock className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">
                Last updated: February 2, 2026
              </p>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader className="bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <CardTitle>Your Privacy Matters</CardTitle>
              </div>
              <CardDescription>
                The Government of India is committed to protecting your privacy and
                ensuring the security of your personal information.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  1. Introduction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  This Privacy Policy describes how the Online FIR Portal (&quot;we,&quot;
                  &quot;us,&quot; or &quot;the Portal&quot;) collects, uses, stores, and protects your
                  personal information when you use our services.
                </p>
                <p>
                  By using the Portal, you consent to the data practices described
                  in this policy. This policy is in compliance with the Information
                  Technology Act, 2000, and the Information Technology (Reasonable
                  Security Practices and Procedures and Sensitive Personal Data or
                  Information) Rules, 2011.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  2. Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h3 className="mb-2 font-semibold">2.1 Personal Information</h3>
                  <p>We collect the following personal information:</p>
                  <ul className="ml-6 mt-2 list-disc space-y-1">
                    <li>Full name and date of birth</li>
                    <li>Aadhaar number (for identity verification)</li>
                    <li>Mobile number and email address</li>
                    <li>Residential address</li>
                    <li>Biometric data (if applicable for enhanced security)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">2.2 FIR-Related Information</h3>
                  <ul className="ml-6 list-disc space-y-1">
                    <li>Details of the incident (date, time, location, description)</li>
                    <li>Witness information (if provided)</li>
                    <li>Supporting documents and evidence</li>
                    <li>Complaint type and category</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">2.3 Technical Information</h3>
                  <ul className="ml-6 list-disc space-y-1">
                    <li>IP address and device information</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Login timestamps and access logs</li>
                    <li>Cookies and session data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">2.4 Communication Data</h3>
                  <ul className="ml-6 list-disc space-y-1">
                    <li>Messages and correspondence with law enforcement</li>
                    <li>Feedback and support requests</li>
                    <li>SMS and email notifications</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  3. How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>We use your information for the following purposes:</p>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">3.1 FIR Processing and Investigation</p>
                    <ul className="ml-6 mt-1 list-disc space-y-1">
                      <li>Registering and processing your complaint</li>
                      <li>Facilitating investigation by law enforcement agencies</li>
                      <li>Assigning cases to appropriate police stations and officers</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">3.2 Communication</p>
                    <ul className="ml-6 mt-1 list-disc space-y-1">
                      <li>Sending status updates and notifications</li>
                      <li>Requesting additional information or documentation</li>
                      <li>Providing case-related updates</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">3.3 Security and Verification</p>
                    <ul className="ml-6 mt-1 list-disc space-y-1">
                      <li>Verifying your identity using Aadhaar</li>
                      <li>Multi-factor authentication (OTP)</li>
                      <li>Preventing fraud and unauthorized access</li>
                      <li>Detecting and preventing cyber threats</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">3.4 Legal and Compliance</p>
                    <ul className="ml-6 mt-1 list-disc space-y-1">
                      <li>Complying with legal obligations and court orders</li>
                      <li>Maintaining records for audit and accountability</li>
                      <li>Producing evidence in legal proceedings</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">3.5 Service Improvement</p>
                    <ul className="ml-6 mt-1 list-disc space-y-1">
                      <li>Analyzing usage patterns to improve the Portal</li>
                      <li>Generating statistical reports (anonymized data)</li>
                      <li>Enhancing user experience and functionality</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  4. Data Sharing and Disclosure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">4.1 Law Enforcement Agencies</p>
                  <p className="mt-1">
                    Your information will be shared with relevant police stations,
                    investigating officers, and law enforcement authorities for the
                    purpose of investigation and legal proceedings.
                  </p>
                </div>

                <div>
                  <p className="font-semibold">4.2 Government Departments</p>
                  <p className="mt-1">
                    We may share your data with other government departments and
                    agencies as required by law or for inter-departmental
                    coordination.
                  </p>
                </div>

                <div>
                  <p className="font-semibold">4.3 Courts and Legal Authorities</p>
                  <p className="mt-1">
                    Your information may be disclosed in response to court orders,
                    subpoenas, or other legal processes.
                  </p>
                </div>

                <div>
                  <p className="font-semibold">4.4 Third-Party Service Providers</p>
                  <p className="mt-1">
                    We may engage trusted third-party service providers for:
                  </p>
                  <ul className="ml-6 mt-1 list-disc space-y-1">
                    <li>SMS and email delivery services</li>
                    <li>Cloud storage and hosting</li>
                    <li>Aadhaar verification services (UIDAI)</li>
                  </ul>
                  <p className="mt-2">
                    These providers are contractually bound to protect your data and
                    use it only for specified purposes.
                  </p>
                </div>

                <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/20">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Important: We do NOT sell or rent your personal information to
                    third parties for marketing purposes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileKey className="h-5 w-5" />
                  5. Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  We implement comprehensive security measures to protect your
                  personal information:
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">5.1 Encryption</p>
                    <ul className="ml-6 mt-1 list-disc space-y-1">
                      <li>
                        <strong>Data in Transit:</strong> All data transmitted
                        between your device and our servers is encrypted using
                        TLS/SSL (HTTPS)
                      </li>
                      <li>
                        <strong>Data at Rest:</strong> Sensitive data is encrypted
                        using AES-256-GCM encryption
                      </li>
                      <li>
                        <strong>Password Protection:</strong> Passwords are hashed
                        using bcrypt with salt
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">5.2 Access Controls</p>
                    <ul className="ml-6 mt-1 list-disc space-y-1">
                      <li>Role-based access control (RBAC) system</li>
                      <li>Multi-factor authentication (MFA)</li>
                      <li>Session management with secure tokens (JWT)</li>
                      <li>IP whitelisting for administrative access</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">5.3 Infrastructure Security</p>
                    <ul className="ml-6 mt-1 list-disc space-y-1">
                      <li>Secure data centers with physical security</li>
                      <li>Regular security audits and penetration testing</li>
                      <li>Firewall protection and intrusion detection systems</li>
                      <li>Automated backup and disaster recovery mechanisms</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">5.4 Monitoring and Logging</p>
                    <ul className="ml-6 mt-1 list-disc space-y-1">
                      <li>Comprehensive audit logs for all access attempts</li>
                      <li>Real-time monitoring for suspicious activities</li>
                      <li>Automated alerts for security incidents</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>6.1 FIR Records:</strong> All FIR records are retained
                  permanently for legal and archival purposes as per government
                  record-keeping requirements.
                </p>
                <p>
                  <strong>6.2 Personal Information:</strong> Your account information
                  will be retained as long as your account is active or as needed to
                  provide services.
                </p>
                <p>
                  <strong>6.3 Technical Logs:</strong> Server logs and access records
                  are retained for 90 days for security and troubleshooting purposes.
                </p>
                <p>
                  <strong>6.4 Legal Hold:</strong> Data subject to legal proceedings
                  or investigations will be retained until the matter is resolved.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>You have the following rights regarding your personal data:</p>
                <div className="space-y-2">
                  <p>
                    <strong>7.1 Right to Access:</strong> You can request a copy of
                    your personal information held by us.
                  </p>
                  <p>
                    <strong>7.2 Right to Correction:</strong> You can update or
                    correct inaccurate information through your account settings.
                  </p>
                  <p>
                    <strong>7.3 Right to Data Portability:</strong> You can request
                    your data in a machine-readable format (subject to technical
                    feasibility).
                  </p>
                  <p>
                    <strong>7.4 Right to Grievance Redressal:</strong> You can file a
                    complaint with our Grievance Officer if you believe your privacy
                    rights have been violated.
                  </p>
                </div>
                <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Note: FIR records cannot be deleted once filed as they are legal
                    documents. However, you can request corrections if information is
                    inaccurate.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>8.1 Essential Cookies:</strong> We use cookies to maintain
                  your session and ensure Portal functionality. These are necessary
                  for the Portal to work.
                </p>
                <p>
                  <strong>8.2 Authentication Tokens:</strong> We use HTTP-only secure
                  cookies to store authentication tokens (access and refresh tokens).
                </p>
                <p>
                  <strong>8.3 No Third-Party Tracking:</strong> We do not use
                  third-party tracking cookies or analytics services that collect
                  personal information.
                </p>
                <p>
                  <strong>8.4 Cookie Management:</strong> You can disable cookies in
                  your browser settings, but this may affect Portal functionality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Children&apos;s Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  The Portal is not intended for use by individuals under the age of
                  18. We do not knowingly collect personal information from children.
                  If you are a parent or guardian and believe your child has provided
                  us with personal information, please contact us immediately.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Changes to This Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  We may update this Privacy Policy from time to time to reflect
                  changes in our practices or legal requirements. We will notify you
                  of significant changes by:
                </p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>Posting the updated policy on the Portal</li>
                  <li>Sending an email notification to your registered email</li>
                  <li>Displaying a prominent notice on the Portal</li>
                </ul>
                <p className="mt-3">
                  Continued use of the Portal after changes constitutes acceptance of
                  the updated policy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Grievance Officer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  In accordance with the Information Technology Act, 2000, and rules
                  made thereunder, the contact details of the Grievance Officer are:
                </p>
                <div className="mt-4 rounded-lg bg-muted p-4">
                  <p className="font-semibold">Grievance Officer Details</p>
                  <p className="mt-2">Name: [To be appointed]</p>
                  <p>Designation: Chief Technology Officer</p>
                  <p>Ministry of Home Affairs, Government of India</p>
                  <p className="mt-2">Email: grievance@onlinefir.gov.in</p>
                  <p>Phone: 1800-XXX-XXXX (Toll Free)</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Response Time: Within 48 hours of receiving the complaint
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>12. Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  For any questions or concerns about this Privacy Policy or our data
                  practices, please contact:
                </p>
                <div className="mt-4 rounded-lg bg-muted p-4">
                  <p className="font-semibold">Online FIR Portal Support</p>
                  <p>Ministry of Home Affairs</p>
                  <p>Government of India</p>
                  <p className="mt-2">Email: privacy@onlinefir.gov.in</p>
                  <p>Support Email: support@onlinefir.gov.in</p>
                  <p>Helpline: 1800-XXX-XXXX (Toll Free)</p>
                  <p className="mt-2">
                    Address: North Block, Central Secretariat, New Delhi - 110001
                  </p>
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
            <Link href="/terms" className="flex-1">
              <Button className="w-full">
                View Terms & Conditions
                <FileKey className="ml-2 h-4 w-4" />
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
