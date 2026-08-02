import Link from "next/link";
import { Shield, Phone, Mail, MapPin, ExternalLink } from "lucide-react";

const quickLinks = [
  { label: "File FIR", href: "#file-fir" },
  { label: "Track Status", href: "#track-status" },
  { label: "Services", href: "#services" },
  { label: "FAQs", href: "#faqs" },
];

const usefulLinks = [
  { label: "Ministry of Home Affairs", href: "https://mha.gov.in", external: true },
  { label: "National Crime Records Bureau", href: "https://ncrb.gov.in", external: true },
  { label: "Cyber Crime Portal", href: "https://cybercrime.gov.in", external: true },
  { label: "Women Helpline", href: "tel:181", external: false },
];

const emergencyNumbers = [
  { label: "Police Emergency", number: "100" },
  { label: "Women Helpline", number: "181" },
  { label: "Cyber Crime", number: "1930" },
  { label: "Child Helpline", number: "1098" },
];

export function Footer() {
  return (
    <footer id="contact" className="border-t border-border bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold">Online FIR Portal</h3>
                <p className="text-sm text-background/70">Government of India</p>
              </div>
            </div>
            <p className="text-sm text-background/80 leading-relaxed">
              An initiative by the Ministry of Home Affairs to provide citizens 
              with a convenient and secure way to file and track First Information Reports online.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-sm text-background/80 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="mb-4 font-semibold">Useful Links</h3>
            <ul className="space-y-2">
              {usefulLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-1 text-sm text-background/80 transition-colors hover:text-primary"
                  >
                    {link.label}
                    {link.external && <ExternalLink className="h-3 w-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency Numbers */}
          <div>
            <h3 className="mb-4 font-semibold">Emergency Numbers</h3>
            <ul className="space-y-3">
              {emergencyNumbers.map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm text-background/70">{item.label}</p>
                    <a 
                      href={`tel:${item.number}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {item.number}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-background/10 pt-8 text-sm text-background/70">
          <a href="mailto:support@efir.gov.in" className="flex items-center gap-2 hover:text-primary">
            <Mail className="h-4 w-4" />
            support@efir.gov.in
          </a>
          <a href="tel:1800-XXX-XXXX" className="flex items-center gap-2 hover:text-primary">
            <Phone className="h-4 w-4" />
            1800-XXX-XXXX (Toll Free)
          </a>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            New Delhi, India
          </span>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-background/10 pt-8 text-center text-sm text-background/60">
          <p className="mb-2">
            © {new Date().getFullYear()} Online FIR Portal. All rights reserved.
          </p>
          <p>
            A Digital India Initiative by the Ministry of Home Affairs, Government of India.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <Link href="#" className="hover:text-primary hover:underline">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary hover:underline">Terms of Service</Link>
            <Link href="#" className="hover:text-primary hover:underline">Accessibility</Link>
            <Link href="#" className="hover:text-primary hover:underline">Site Map</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
