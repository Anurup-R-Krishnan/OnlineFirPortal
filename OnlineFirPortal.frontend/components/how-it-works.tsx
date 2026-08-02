import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  UserPlus,
  FileText,
  Search,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: "Register & Verify",
    description:
      "Create an account using your Aadhaar number and verify with OTP. Setup mandatory Two-Factor Authentication for security.",
  },
  {
    step: 2,
    icon: FileText,
    title: "File Your FIR",
    description:
      "Fill out the FIR form with incident details, upload evidence, and submit. Your data is encrypted and digitally signed.",
  },
  {
    step: 3,
    icon: ShieldCheck,
    title: "Police Review",
    description:
      "Your FIR is reviewed by the police station. An investigating officer is assigned to your case.",
  },
  {
    step: 4,
    icon: Search,
    title: "Track Progress",
    description:
      "Get real-time updates on your case status. Receive notifications at every stage of the investigation.",
  },
];

const features = [
  "End-to-end encryption for sensitive data",
  "Digital signatures for document integrity",
  "Multi-factor authentication for all users",
  "Role-based access control",
  "Complete audit trail of all actions",
  "QR code for instant FIR verification",
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-muted-foreground">
            Filing an FIR online is simple, secure, and transparent. Follow these
            steps to register your complaint.
          </p>
        </div>

        {/* Steps */}
        <div className="mb-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.step}
                className="relative border-border transition-shadow hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-4xl font-bold text-primary/20">
                      {item.step.toString().padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Security Features */}
        <div className="rounded-2xl border border-border bg-primary/5 p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">
                Enterprise-Grade Security
              </h3>
              <p className="mb-6 text-muted-foreground">
                Your data is protected with the same security standards used by
                government agencies worldwide. We implement multiple layers of
                protection to ensure your information remains confidential.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-center gap-4 text-center lg:items-end lg:text-right">
              <div className="rounded-lg border border-border bg-card p-6 shadow-lg">
                <div className="mb-4 flex justify-center lg:justify-end">
                  <ShieldCheck className="h-16 w-16 text-primary" />
                </div>
                <p className="mb-4 font-semibold text-foreground">
                  Ready to file your FIR securely?
                </p>
                <Button asChild className="w-full gap-2">
                  <Link href="/auth">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
