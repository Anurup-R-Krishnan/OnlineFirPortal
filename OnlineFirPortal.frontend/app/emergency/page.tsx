"use client";

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
  Shield,
  Phone,
  ArrowLeft,
  AlertTriangle,
  Ambulance,
  Flame,
  Baby,
  Heart,
  Users,
  Car,
  Wifi,
  Building,
} from "lucide-react";

const emergencyNumbers = [
  {
    name: "National Emergency Number",
    number: "112",
    description: "For all emergencies - Police, Fire, Ambulance",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-700",
    priority: true,
  },
  {
    name: "Police",
    number: "100",
    description: "Report crimes, thefts, and law enforcement emergencies",
    icon: Shield,
    color: "bg-blue-100 text-blue-700",
    priority: true,
  },
  {
    name: "Ambulance",
    number: "102",
    description: "Medical emergencies and ambulance services",
    icon: Ambulance,
    color: "bg-green-100 text-green-700",
    priority: true,
  },
  {
    name: "Fire",
    number: "101",
    description: "Fire emergencies and rescue operations",
    icon: Flame,
    color: "bg-orange-100 text-orange-700",
    priority: true,
  },
  {
    name: "Women Helpline",
    number: "181",
    description: "Support for women in distress, domestic violence",
    icon: Heart,
    color: "bg-pink-100 text-pink-700",
    priority: false,
  },
  {
    name: "Child Helpline",
    number: "1098",
    description: "Child abuse, missing children, child labor",
    icon: Baby,
    color: "bg-purple-100 text-purple-700",
    priority: false,
  },
  {
    name: "Senior Citizen Helpline",
    number: "14567",
    description: "Support and assistance for senior citizens",
    icon: Users,
    color: "bg-teal-100 text-teal-700",
    priority: false,
  },
  {
    name: "Road Accident Emergency",
    number: "1073",
    description: "Highway accidents and road emergencies",
    icon: Car,
    color: "bg-yellow-100 text-yellow-700",
    priority: false,
  },
  {
    name: "Cyber Crime Helpline",
    number: "1930",
    description: "Online fraud, cyberbullying, digital crimes",
    icon: Wifi,
    color: "bg-indigo-100 text-indigo-700",
    priority: false,
  },
  {
    name: "Disaster Management",
    number: "108",
    description: "Natural disasters and emergency response",
    icon: Building,
    color: "bg-gray-100 text-gray-700",
    priority: false,
  },
];

const stateHelplines = [
  { state: "Delhi", number: "011-23490350", police: "100" },
  { state: "Maharashtra", number: "022-22621855", police: "100" },
  { state: "Karnataka", number: "080-22943225", police: "100" },
  { state: "Tamil Nadu", number: "044-23452365", police: "100" },
  { state: "West Bengal", number: "033-22143024", police: "100" },
  { state: "Gujarat", number: "079-23250798", police: "100" },
  { state: "Rajasthan", number: "0141-2744127", police: "100" },
  { state: "Uttar Pradesh", number: "0522-2638777", police: "100" },
];

export default function EmergencyPage() {
  const priorityNumbers = emergencyNumbers.filter((n) => n.priority);
  const otherNumbers = emergencyNumbers.filter((n) => !n.priority);

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
                Emergency Services
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
          {/* Hero Section */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Emergency Helplines
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Quick access to all important emergency numbers in India. In case
              of emergency, call the appropriate helpline immediately.
            </p>
          </div>

          {/* Priority Emergency Numbers */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Primary Emergency Numbers
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {priorityNumbers.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.number}
                    className="border-2 border-border transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <CardContent className="p-6 text-center">
                      <div
                        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${item.color}`}
                      >
                        <Icon className="h-8 w-8" />
                      </div>
                      <h3 className="mb-1 font-semibold text-foreground">
                        {item.name}
                      </h3>
                      <a
                        href={`tel:${item.number}`}
                        className="mb-2 block text-3xl font-bold text-primary hover:underline"
                      >
                        {item.number}
                      </a>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <Button
                        className="mt-4 w-full gap-2"
                        asChild
                      >
                        <a href={`tel:${item.number}`}>
                          <Phone className="h-4 w-4" />
                          Call Now
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Other Helplines */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Specialized Helplines
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {otherNumbers.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.number} className="border-border">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${item.color}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {item.name}
                        </h3>
                        <a
                          href={`tel:${item.number}`}
                          className="text-lg font-bold text-primary hover:underline"
                        >
                          {item.number}
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="outline"
                        className="shrink-0 bg-transparent"
                        asChild
                      >
                        <a href={`tel:${item.number}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* State Helplines */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>State Police Control Rooms</CardTitle>
              <CardDescription>
                Direct contact numbers for state police headquarters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stateHelplines.map((item) => (
                  <div
                    key={item.state}
                    className="rounded-lg border border-border p-4"
                  >
                    <h4 className="mb-2 font-semibold text-foreground">
                      {item.state}
                    </h4>
                    <a
                      href={`tel:${item.number}`}
                      className="block text-sm text-primary hover:underline"
                    >
                      {item.number}
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Safety Tips */}
          <Card className="mt-8 border-border bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Important Safety Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-2">
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Stay calm and speak clearly when calling emergency services
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Provide your exact location and nearby landmarks
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Describe the emergency situation briefly but accurately
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Keep your phone line free after calling for callback
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Note down any important details like vehicle numbers or descriptions
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Do not move injured persons unless absolutely necessary
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4 text-center">
        <p className="text-sm text-muted-foreground">
          In case of life-threatening emergency, call{" "}
          <a href="tel:112" className="font-bold text-primary">
            112
          </a>{" "}
          immediately
        </p>
      </footer>
    </div>
  );
}
