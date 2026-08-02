"use client";

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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Download,
  BookOpen,
  Scale,
  HelpCircle,
} from "lucide-react";

const filingSteps = [
  {
    step: 1,
    title: "Create an Account / Login",
    description:
      "Register using your Aadhaar number and mobile phone. Verify your identity through OTP sent to your Aadhaar-linked mobile number.",
  },
  {
    step: 2,
    title: "Fill Personal Details",
    description:
      "Provide your complete personal information including name, address, and contact details. Ensure all information matches your official documents.",
  },
  {
    step: 3,
    title: "Describe the Incident",
    description:
      "Select the type of complaint and provide a detailed description of what happened, when it happened, and where it occurred.",
  },
  {
    step: 4,
    title: "Add Location & Witnesses",
    description:
      "Specify the exact location of the incident with landmarks. Add witness details if any witnesses were present.",
  },
  {
    step: 5,
    title: "Upload Evidence",
    description:
      "Upload relevant documents, photos, videos, or any other evidence supporting your complaint.",
  },
  {
    step: 6,
    title: "Review & Submit",
    description:
      "Review all entered information, accept the declaration, and submit your FIR. Save or download the receipt for future reference.",
  },
];

const dosAndDonts = {
  dos: [
    "Provide accurate and truthful information in your complaint",
    "Include as many details as possible about the incident",
    "Upload clear photos and documents as evidence",
    "Note down names, vehicle numbers, or any identifying information",
    "Keep your FIR reference number safe for tracking",
    "Respond promptly if contacted by investigating officer",
    "Update your contact information if it changes",
    "Report the incident as soon as possible after it occurs",
  ],
  donts: [
    "Do not file false or misleading complaints (punishable offense)",
    "Do not include abusive or defamatory language",
    "Do not upload irrelevant or inappropriate content",
    "Do not share your login credentials with anyone",
    "Do not file multiple FIRs for the same incident",
    "Do not interfere with the investigation process",
    "Do not contact the accused directly after filing FIR",
    "Do not destroy or tamper with evidence",
  ],
};

const legalInfo = [
  {
    title: "What is an FIR?",
    content:
      "First Information Report (FIR) is a written document prepared by police when they receive information about the commission of a cognizable offense. It is the starting point of criminal proceedings and sets the criminal law in motion.",
  },
  {
    title: "Zero FIR",
    content:
      "A Zero FIR can be filed at any police station regardless of the jurisdiction where the incident occurred. The FIR will be transferred to the appropriate police station later. This ensures immediate registration of complaint.",
  },
  {
    title: "Section 154 CrPC",
    content:
      "Under Section 154 of the Code of Criminal Procedure, every information relating to a cognizable offense, given orally or in writing, shall be reduced to writing and signed by the informant. A copy shall be given free of cost.",
  },
  {
    title: "Consequences of False FIR",
    content:
      "Filing a false FIR is punishable under Section 182 and Section 211 of the Indian Penal Code. The punishment may include imprisonment up to 6 months, or fine, or both.",
  },
  {
    title: "Right to Free Copy",
    content:
      "As per law, every complainant is entitled to receive a free copy of the FIR immediately upon registration. This portal provides instant download of the registered FIR.",
  },
  {
    title: "Time Limit for Filing",
    content:
      "While there is no specific time limit for filing an FIR, it is advisable to file as soon as possible. Delayed reporting may affect the investigation and evidence collection.",
  },
];

const faqs = [
  {
    question: "What types of complaints can be filed online?",
    answer:
      "You can file complaints for theft, vehicle theft, lost property, cyber crimes, fraud, missing persons, and other non-emergency criminal offenses. For violent crimes or emergencies, please call 100 or 112 immediately.",
  },
  {
    question: "Is the online FIR legally valid?",
    answer:
      "Yes, FIRs filed through this official government portal are legally valid and equivalent to FIRs filed at a police station. You will receive a digitally signed copy with a unique reference number.",
  },
  {
    question: "How long does it take to process an online FIR?",
    answer:
      "Online FIRs are typically acknowledged within 24 hours. An investigating officer is usually assigned within 24-48 hours. The investigation timeline depends on the nature and complexity of the case.",
  },
  {
    question: "Can I edit my FIR after submission?",
    answer:
      "No, once submitted, an FIR cannot be edited directly. However, you can submit additional information or corrections through the feedback section in the tracking page, which will be added to your case file.",
  },
  {
    question: "What if I don't have an Aadhaar card?",
    answer:
      "Aadhaar verification is required for online FIR filing. If you don't have Aadhaar, you may visit your nearest police station to file the FIR in person with alternative identity proof.",
  },
  {
    question: "Can I withdraw an FIR filed online?",
    answer:
      "FIR withdrawal (compounding) is only possible for certain types of offenses and requires court approval. Contact your investigating officer or seek legal advice for guidance on this matter.",
  },
  {
    question: "Is my information kept confidential?",
    answer:
      "Yes, all information is treated as confidential and protected under government data security protocols. Your personal details are only shared with authorized investigating officers.",
  },
  {
    question: "What documents should I keep ready before filing?",
    answer:
      "Keep your Aadhaar card, mobile phone (for OTP), details of the incident (date, time, place), any evidence (photos, videos, documents), and witness contact information if available.",
  },
];

export default function GuidelinesPage() {
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
                Guidelines & Help
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
          {/* Hero */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Guidelines & Help Center
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Everything you need to know about filing FIRs online, legal
              information, and frequently asked questions.
            </p>
          </div>

          {/* Quick Links */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">How to File</p>
                  <p className="text-xs text-muted-foreground">Step-by-step guide</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Legal Info</p>
                  <p className="text-xs text-muted-foreground">Know your rights</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">FAQs</p>
                  <p className="text-xs text-muted-foreground">Common questions</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-border transition-all hover:border-primary/50 hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Downloads</p>
                  <p className="text-xs text-muted-foreground">Forms & documents</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="how-to-file" className="space-y-8">
            <TabsList className="flex w-full flex-wrap justify-start gap-2">
              <TabsTrigger value="how-to-file">How to File FIR</TabsTrigger>
              <TabsTrigger value="dos-donts">{"Do's & Don'ts"}</TabsTrigger>
              <TabsTrigger value="legal">Legal Information</TabsTrigger>
              <TabsTrigger value="faqs">FAQs</TabsTrigger>
            </TabsList>

            {/* How to File Tab */}
            <TabsContent value="how-to-file">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Step-by-Step Guide to File FIR Online
                  </CardTitle>
                  <CardDescription>
                    Follow these simple steps to register your complaint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {filingSteps.map((item, index) => (
                      <div key={item.step} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                            {item.step}
                          </div>
                          {index !== filingSteps.length - 1 && (
                            <div className="h-full w-0.5 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <h4 className="font-semibold text-foreground">
                            {item.title}
                          </h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-center">
                    <Button size="lg" asChild>
                      <Link href="/file-fir">Start Filing FIR Now</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Do's and Don'ts Tab */}
            <TabsContent value="dos-donts">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      {"Do's"}
                    </CardTitle>
                    <CardDescription>
                      Best practices when filing an FIR
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {dosAndDonts.dos.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-5 w-5" />
                      {"Don'ts"}
                    </CardTitle>
                    <CardDescription>
                      What to avoid when filing an FIR
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {dosAndDonts.donts.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6 border-yellow-200 bg-yellow-50/50">
                <CardContent className="flex gap-4 p-4">
                  <AlertTriangle className="h-6 w-6 shrink-0 text-yellow-600" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">
                      Important Warning
                    </h4>
                    <p className="text-sm text-yellow-700">
                      Filing a false FIR is a serious criminal offense punishable
                      under Section 182 and Section 211 of the Indian Penal Code.
                      Penalties include imprisonment up to 6 months, fine, or both.
                      Always provide truthful and accurate information.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Legal Information Tab */}
            <TabsContent value="legal">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-primary" />
                    Legal Information
                  </CardTitle>
                  <CardDescription>
                    Understanding FIR laws and your rights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {legalInfo.map((item) => (
                      <Card key={item.title} className="border-border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {item.content}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQs Tab */}
            <TabsContent value="faqs">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>
                    Find answers to common questions about online FIR filing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Need Help Section */}
          <Card className="mt-8 border-border bg-primary/5">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Info className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">
                  Still have questions?
                </h3>
                <p className="text-muted-foreground">
                  If you could not find the answer you are looking for, contact our
                  support team or visit your nearest police station.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="bg-transparent" asChild>
                  <Link href="/emergency">Emergency Numbers</Link>
                </Button>
                <Button asChild>
                  <Link href="/file-fir">File FIR Now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
