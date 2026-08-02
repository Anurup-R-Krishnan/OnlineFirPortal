import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is an FIR and when should I file one?",
    answer: "A First Information Report (FIR) is a written document prepared by the police when they receive information about the commission of a cognizable offense. You should file an FIR when you are a victim of or witness to a crime such as theft, robbery, assault, fraud, or any other criminal offense.",
  },
  {
    question: "Can I file an FIR online for any type of crime?",
    answer: "Currently, online FIR filing is available for certain types of complaints including theft, lost property, vehicle theft, cyber crimes, and missing persons. For serious crimes involving physical violence or immediate danger, please contact your nearest police station or call 100 immediately.",
  },
  {
    question: "What documents do I need to file an online FIR?",
    answer: "To file an online FIR, you'll need: a valid government ID (Aadhaar, PAN, Voter ID), your contact details, details of the incident (date, time, place), and any supporting evidence such as photographs, videos, or documents related to the complaint.",
  },
  {
    question: "How long does it take to process an online FIR?",
    answer: "Once submitted, your FIR will be acknowledged within 24-48 hours. A reference number will be generated immediately upon submission. The concerned police station will contact you within 72 hours for verification and further proceedings.",
  },
  {
    question: "Can I track the status of my FIR?",
    answer: "Yes, you can track your FIR status using the reference number provided at the time of registration. Use the 'Track Status' feature on this portal to get real-time updates on your complaint's progress.",
  },
  {
    question: "Is it safe to file an FIR online?",
    answer: "Yes, the online FIR portal uses bank-grade encryption to protect your data. All information is securely transmitted and stored in compliance with government data protection guidelines. Your personal information is only accessible to authorized police personnel.",
  },
  {
    question: "What if I want to withdraw my FIR?",
    answer: "FIR withdrawal is a legal process that requires visiting the concerned police station. For compoundable offenses, you may file a request for withdrawal. However, for non-compoundable offenses, the case cannot be withdrawn once filed.",
  },
  {
    question: "Can I file an anonymous complaint?",
    answer: "While the standard FIR requires identity verification, you can file anonymous tips through the dedicated helpline or through the 'Report Anonymously' feature for certain types of information sharing. However, formal FIRs require identity verification for legal proceedings.",
  },
];

export function FAQSection() {
  return (
    <section id="faqs" className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-pretty">
            Find answers to common questions about filing and tracking FIRs online.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="rounded-lg border border-border bg-card px-6 data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-primary hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
