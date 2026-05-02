import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, FileText, MessageCircle, Shield, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Document Analyzer",
    desc: "Upload any legal document — get a plain-language summary of your rights and next steps.",
  },
  {
    icon: MessageCircle,
    title: "Legal Q&A Chat",
    desc: "Ask any legal question in Nepali, Hindi, or English. Get answers with actual law citations.",
  },
  {
    icon: Shield,
    title: "Rights Navigator",
    desc: "Explore your rights by category — Land, Labor, Criminal, Family, Consumer.",
  },
];

const stats = [
  { label: "Legal Documents Analyzed", value: "10,000+" },
  { label: "Citizens Helped", value: "5,000+" },
  { label: "Nepal Laws Covered", value: "50+" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">

      {/* Navbar */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Scale className="text-primary w-6 h-6" />
          <span className="font-bold text-xl text-foreground">LegalSaathi</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <Badge className="mb-6 text-sm px-4 py-1" variant="secondary">
          🇳🇵 Nepal's First AI Legal Assistant
        </Badge>

        <h1 className="text-5xl font-bold text-foreground leading-tight mb-6">
          आफ्नो अधिकार जान्नुहोस् <br />
          <span className="text-primary">सरल भाषामा</span>
        </h1>

        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
          LegalSaathi helps everyday Nepali citizens understand complex legal
          documents, know their rights, and get plain-language guidance —
          in Nepali, Hindi, and English.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/ask">
            <Button size="lg" variant="outline">
              Ask a Legal Question
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/40 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-bold text-primary">{stat.value}</p>
              <p className="text-muted-foreground mt-1 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center text-foreground mb-4">
          Everything You Need
        </h2>
        <p className="text-center text-muted-foreground mb-14">
          Powerful AI tools built specifically for Nepal's legal system
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card rounded-2xl p-8 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl legal-gradient flex items-center justify-center mb-5">
                <feature.icon className="text-white w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why LegalSaathi */}
      <section className="bg-muted/40 border-t border-border py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Why LegalSaathi?
            </h2>
            <ul className="space-y-4">
              {[
                "Understands Nepal's Constitution, Civil & Criminal Code",
                "Answers in Nepali, Hindi, and English",
                "Analyzes documents with OCR — even handwritten ones",
                "Cites actual laws, not generic advice",
                "100% private — your documents stay yours",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle className="text-primary w-5 h-5 mt-0.5 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="legal-gradient rounded-3xl p-10 text-white text-center">
            <Scale className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h3 className="text-2xl font-bold mb-3">न्याय सबैको लागि</h3>
            <p className="opacity-80 text-sm leading-relaxed">
              Justice for Everyone — regardless of education, language, or
              background. LegalSaathi bridges the gap between complex law
              and everyday citizens.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Ready to Know Your Rights?
        </h2>
        <p className="text-muted-foreground mb-8">
          Join thousands of Nepali citizens using LegalSaathi every day.
        </p>
        <Link href="/register">
          <Button size="lg" className="gap-2">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-muted-foreground text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Scale className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">LegalSaathi</span>
        </div>
        <p>© 2025 LegalSaathi. Built for Nepal 🇳🇵</p>
      </footer>

    </main>
  );
}