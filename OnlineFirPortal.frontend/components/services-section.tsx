import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Search, 
  Download, 
  Shield, 
  AlertTriangle, 
  Users, 
  Car, 
  Smartphone 
} from "lucide-react";

const services = [
  {
    icon: FileText,
    title: "File New FIR",
    description: "Register a new First Information Report online with all required details and evidence.",
  },
  {
    icon: Search,
    title: "Track FIR Status",
    description: "Check the current status and progress of your filed FIR using your reference number.",
  },
  {
    icon: Download,
    title: "Download FIR Copy",
    description: "Get a digital copy of your registered FIR for your records and legal purposes.",
  },
  {
    icon: AlertTriangle,
    title: "Report Cyber Crime",
    description: "Report online fraud, hacking, identity theft, and other cyber-related offenses.",
  },
  {
    icon: Car,
    title: "Vehicle Theft Report",
    description: "Specialized portal for reporting stolen or missing vehicles quickly.",
  },
  {
    icon: Users,
    title: "Missing Person Report",
    description: "File reports for missing persons with photo upload and detailed descriptions.",
  },
  {
    icon: Smartphone,
    title: "Lost Mobile Report",
    description: "Report lost or stolen mobile phones with IMEI tracking assistance.",
  },
  {
    icon: Shield,
    title: "Women Safety",
    description: "Dedicated helpline and quick reporting for women-related safety concerns.",
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Our Services
          </h2>
          <p className="text-muted-foreground text-pretty">
            Comprehensive digital services to help citizens report and track various types of complaints efficiently.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <Card 
              key={service.title} 
              className="group cursor-pointer border-border transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
            >
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <service.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {service.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
