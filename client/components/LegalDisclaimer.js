"use client";

import { useState } from "react";
import { AlertTriangle, X, ChevronDown, ChevronUp } from "lucide-react";

// Props:
// variant — "banner" | "inline" | "modal"
// dismissible — boolean (default: true)

export default function LegalDisclaimer({ variant = "inline", dismissible = true, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  // ── Inline Variant — shown below every AI response ───────
  if (variant === "inline") {
    return (
      <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 mt-4">
        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
            Legal Information Only — Not Legal Advice
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5 leading-relaxed">
            LegalSaathi provides general legal information based on Nepal law. 
            This is not a substitute for professional legal advice. 
            Always consult a qualified lawyer for serious legal matters.
          </p>
        </div>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-500 hover:text-yellow-700 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // ── Banner Variant — shown at top of ask/analyze pages ───
  if (variant === "banner") {
    return (
      <div className="w-full bg-yellow-50 dark:bg-yellow-950/40 border-b border-yellow-200 dark:border-yellow-800">
        <div className="max-w-4xl mx-auto px-6 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
            <p className="text-xs text-yellow-800 dark:text-yellow-300">
              <span className="font-semibold">Disclaimer:</span>{" "}
              LegalSaathi provides general legal information only — not legal advice.
              {" "}
              <button
                onClick={() => setExpanded(!expanded)}
                className="underline font-medium inline-flex items-center gap-0.5"
              >
                {expanded ? "Less" : "More"}
                {expanded
                  ? <ChevronUp className="w-3 h-3" />
                  : <ChevronDown className="w-3 h-3" />
                }
              </button>
            </p>
          </div>
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="text-yellow-500 hover:text-yellow-700 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="max-w-4xl mx-auto px-6 pb-3">
            <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed">
              The information provided by LegalSaathi is for general informational 
              purposes only. It is based on Nepal law and AI analysis and may not 
              reflect the most current legal developments. Nothing on this platform 
              constitutes legal advice, and no attorney-client relationship is formed 
              by using this service. For legal advice specific to your situation, 
              always consult a qualified and licensed legal professional in Nepal.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Modal Variant — shown on first visit ─────────────────
  if (variant === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
        <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full p-6">

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Important Disclaimer</h2>
              <p className="text-xs text-muted-foreground">Please read before continuing</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              <span className="font-semibold text-foreground">LegalSaathi</span> is an 
              AI-powered legal information tool. It provides general information based 
              on Nepal law — it does <span className="font-semibold text-foreground">not</span> provide legal advice.
            </p>
            <p>
              The AI responses may not be 100% accurate or up to date. Laws change 
              frequently and individual circumstances vary greatly.
            </p>
            <p>
              By continuing, you agree that:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>You will not rely solely on LegalSaathi for legal decisions</li>
              <li>You will consult a qualified lawyer for serious matters</li>
              <li>LegalSaathi is not liable for any decisions made based on this information</li>
            </ul>
            <p className="text-xs">
               LegalSaathi — न्याय सबैको लागि
            </p>
          </div>

          <button
  onClick={() => {
    setDismissed(true);
    onDismiss?.();
  }}
  className="w-full mt-6 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
>
  I Understand — Continue
</button>

        </div>
      </div>
    );
  }

  return null;
}