import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Search } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4a87e810_1px,transparent_1px),linear-gradient(to_bottom,#4a87e810_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Digital India Initiative
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground text-balance md:text-5xl lg:text-6xl">
            File Your FIR Online,{" "}
            <span className="text-primary">Anytime, Anywhere</span>
          </h1>
          
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground text-pretty md:text-xl">
            A secure and convenient way to register your First Information Report digitally. 
            No queues, no delays — report incidents from the comfort of your home.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full gap-2 sm:w-auto" asChild>
              <Link href="/file-fir">
                <FileText className="h-5 w-5" />
                File New FIR
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto bg-transparent" asChild>
              <Link href="/track">
                <Search className="h-5 w-5" />
                Track Your FIR
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
