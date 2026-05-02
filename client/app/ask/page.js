"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scale, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  askLegalQuestion,
  isAuthenticated,
  isTokenExpired,
  logoutUser,
} from "@/lib/api";
import ChatInterface from "@/components/ChatInterface";
import LegalDisclaimer from "@/components/LegalDisclaimer";

const INITIAL_MESSAGE = {
  id: 1,
  role: "assistant",
  content:
    "नमस्ते! म LegalSaathi हुँ। तपाईंको कुनै पनि कानुनी प्रश्नको उत्तर दिन म यहाँ छु। नेपाली, हिंदी, वा अंग्रेजीमा सोध्नुहोस्।\n\nHello! I am LegalSaathi. Ask me any legal question in Nepali, Hindi, or English.",
  timestamp: new Date().toISOString(),
};

const SUGGESTED_QUESTIONS = [
  "भाडावालाको के के अधिकारहरू छन्?",
  "श्रम कानून अनुसार काम गर्ने घण्टा कति हो?",
  "जग्गा दर्ता कसरी गर्ने?",
  "What are my rights if arrested by police?",
  "How to file a consumer complaint in Nepal?",
];

export default function AskPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("ne");
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  useEffect(() => {
    // Check localStorage token (works in production cross-domain)
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Only show modal disclaimer once per session
    const seen = sessionStorage.getItem("disclaimer_seen");
    if (seen) setShowDisclaimer(false);
  }, []);

  const handleDisclaimerDismiss = () => {
    setShowDisclaimer(false);
    sessionStorage.setItem("disclaimer_seen", "true");
  };

  const handleSend = async (text) => {
    if (!text.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await askLegalQuestion({
        question: text,
        language,
        history,
      });

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: res.answer,
        timestamp: new Date().toISOString(),
        laws: res.lawsCited || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));

      if (error.message.includes("503") || error.message.includes("unavailable")) {
        toast.error("AI service is unavailable. Make sure the AI service is running.");
      } else {
        toast.error(error.message || "Failed to get response. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    toast.success("Chat reset.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Modal Disclaimer — shows once per session */}
      {showDisclaimer && (
        <LegalDisclaimer
          variant="modal"
          dismissible={true}
          onDismiss={handleDisclaimerDismiss}
        />
      )}

      {/* Navbar */}
      <nav className="border-b border-border px-6 py-4 shrink-0">
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

      <div className="max-w-4xl mx-auto w-full px-6 py-6 flex flex-col flex-1">

        {/* Header */}
        <div className="mb-6 shrink-0">
          <h1 className="text-2xl font-bold text-foreground">Legal Q&A</h1>
          <p className="text-sm text-muted-foreground">
            Ask anything about Nepal law — powered by AI + Nepal legal corpus
          </p>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 min-h-0">
          <ChatInterface
            messages={messages}
            onSend={handleSend}
            onReset={handleReset}
            loading={loading}
            language={language}
            onLanguageChange={setLanguage}
            suggestions={SUGGESTED_QUESTIONS}
          />
        </div>

      </div>
    </div>
  );
}