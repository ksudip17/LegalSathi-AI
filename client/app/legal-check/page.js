"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  ArrowLeft,
  Search,
  Loader2,
  Sparkles,
  Mic,
  MicOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { checkLegalStatement } from "@/lib/api";
import LegalVerdict from "@/components/LegalVerdict";
import LanguageSelector from "@/components/LanguageSelector";
import LegalDisclaimer from "@/components/LegalDisclaimer";

const EXAMPLE_STATEMENTS = [
  {
    ne: "मेरो घरधनीले बिना सूचना मेरो कोठामा प्रवेश गर्यो",
    en: "My landlord entered my room without notice",
  },
  {
    ne: "मालिकले मलाई ओभरटाइम तलब दिएन",
    en: "My employer did not pay me overtime salary",
  },
  {
    ne: "प्रहरीले वारेन्ट बिना मेरो घर तलासी लियो",
    en: "Police searched my house without a warrant",
  },
  {
    ne: "घरधनीले ३५ दिनको सूचना नदिई मलाई निकाल्यो",
    en: "Landlord evicted me without 35 days notice",
  },
  {
    ne: "कम्पनीले मलाई कारण नदिई बर्खास्त गर्यो",
    en: "Company fired me without giving a reason",
  },
  {
    ne: "पसलेले म्याद नाघेको खाना बेच्यो",
    en: "Shopkeeper sold me expired food products",
  },
];

export default function LegalCheckPage() {
  const [statement, setStatement] = useState("");
  const [language, setLanguage] = useState("ne");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [checkedStatement, setCheckedStatement] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const MAX_CHARS = 500;

  useEffect(() => {
    setCharCount(statement.length);
  }, [statement]);

  const handleCheck = async () => {
    if (!statement.trim()) {
      toast.error("Please describe the situation first.");
      return;
    }
    if (statement.trim().length < 10) {
      toast.error("Please describe the situation in more detail.");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const res = await checkLegalStatement({
        statement: statement.trim(),
        language,
      });

      setResult(res);
      setCheckedStatement(statement.trim());

    } catch (error) {
      if (error.message.includes("429")) {
        toast.error("AI is busy. Please wait 30 seconds and try again.");
      } else if (error.message.includes("503")) {
        toast.error("AI service unavailable. Make sure it is running.");
      } else {
        toast.error(error.message || "Failed to check. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExample = (example) => {
    const text = language === "ne" ? example.ne : example.en;
    setStatement(text);
    setResult(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      handleCheck();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.info("Voice input coming soon!");
    } else {
      setIsRecording(true);
      toast.info("Voice input coming soon!");
      setTimeout(() => setIsRecording(false), 2000);
    }
  };

  const handleReset = () => {
    setStatement("");
    setResult(null);
    setCheckedStatement("");
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Navbar */}
      <nav className="border-b border-border px-6 py-4 sticky top-0 bg-background/80 backdrop-blur-sm z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="text-primary w-6 h-6" />
            <span className="font-bold text-xl">LegalSaathi</span>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* Banner Disclaimer */}
      <LegalDisclaimer variant="banner" dismissible={true} />

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Powered by Nepal Legal Corpus + AI
          </div>
          <h1 className="text-4xl font-black text-foreground mb-3">
            के यो कानुनी छ?
          </h1>
          <p className="text-xl text-muted-foreground mb-1">
            Is This Legal?
          </p>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Describe any situation in Nepali, Hindi, or English.
            Get an instant legal verdict based on Nepal law.
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center mb-6">
          <LanguageSelector
            value={language}
            onChange={(lang) => {
              setLanguage(lang);
              setResult(null);
            }}
            variant="pills"
          />
        </div>

        {/* Input Area */}
        <div className="relative mb-4">
          <div className={`border-2 rounded-2xl transition-all ${
            statement.length > 0
              ? "border-primary"
              : "border-border hover:border-primary/50"
          }`}>
            <textarea
              value={statement}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setStatement(e.target.value);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                language === "ne"
                  ? "यहाँ आफ्नो परिस्थिति वर्णन गर्नुहोस्...\nउदाहरण: मेरो घरधनीले बिना सूचना कोठामा प्रवेश गर्यो"
                  : language === "hi"
                  ? "यहाँ अपनी स्थिति का वर्णन करें...\nउदाहरण: मेरे मकान मालिक ने बिना सूचना कमरे में प्रवेश किया"
                  : "Describe the situation here...\nExample: My landlord entered my room without giving any notice"
              }
              className="w-full bg-transparent px-5 pt-5 pb-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base min-h-[120px]"
              disabled={loading}
            />

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-5 pb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleRecording}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording
                      ? "text-destructive bg-destructive/10 animate-pulse"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {isRecording
                    ? <MicOff className="w-4 h-4" />
                    : <Mic className="w-4 h-4" />
                  }
                </button>
                <span className={`text-xs ${
                  charCount > MAX_CHARS * 0.9
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}>
                  {charCount}/{MAX_CHARS}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {(statement || result) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-muted-foreground text-xs"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  onClick={handleCheck}
                  disabled={!statement.trim() || loading}
                  className="gap-2 rounded-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Check Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Example Statements */}
        {!result && !loading && (
          <div className="mb-10">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3 text-center">
              Try These Examples
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLE_STATEMENTS.map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleExample(example)}
                  className="text-xs px-3 py-2 rounded-xl border border-border hover:border-primary hover:text-primary text-muted-foreground transition-all text-left"
                >
                  {language === "ne" ? example.ne : example.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 legal-gradient rounded-2xl flex items-center justify-center mx-auto mb-5 animate-pulse">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <p className="text-foreground font-semibold text-lg mb-2">
              Analyzing under Nepal Law...
            </p>
            <p className="text-muted-foreground text-sm">
              Searching legal corpus · Checking relevant laws · Preparing verdict
            </p>
          </div>
        )}

        {/* Verdict Result */}
        {result && !loading && (
          <div className="mt-6">
            <LegalVerdict
              result={result}
              statement={checkedStatement}
            />
          </div>
        )}

        {/* How It Works */}
        {!result && !loading && (
          <div className="mt-16 border-t border-border pt-10">
            <h2 className="text-center text-lg font-semibold text-foreground mb-8">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "Describe the Situation",
                  desc: "Type what happened in Nepali, Hindi, or English in plain simple words.",
                  icon: "✍️",
                },
                {
                  step: "2",
                  title: "AI Searches Nepal Law",
                  desc: "Our AI searches the full Nepal legal corpus including Constitution, Civil Code, Labor Act.",
                  icon: "🔍",
                },
                {
                  step: "3",
                  title: "Get Instant Verdict",
                  desc: "Receive a clear LEGAL or ILLEGAL verdict with exact law citations and your rights.",
                  icon: "⚖️",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mx-auto mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}