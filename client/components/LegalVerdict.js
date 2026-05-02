"use client";

import { useState, useRef } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Share2,
  Copy,
  Download,
  Scale,
  Shield,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

// ─── Verdict Config ───────────────────────────────────────────
const VERDICT_CONFIG = {
  LEGAL: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-200 dark:border-green-800",
    badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    label: "LEGAL",
    labelNp: "कानुनी",
    emoji: "✅",
  },
  ILLEGAL: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    label: "ILLEGAL",
    labelNp: "गैरकानुनी",
    emoji: "❌",
  },
  UNCLEAR: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    border: "border-yellow-200 dark:border-yellow-800",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    label: "UNCLEAR",
    labelNp: "अस्पष्ट",
    emoji: "⚠️",
  },
};

const SEVERITY_CONFIG = {
  low: { color: "text-green-600", label: "Low Severity" },
  medium: { color: "text-yellow-600", label: "Medium Severity" },
  high: { color: "text-red-600", label: "High Severity" },
  critical: { color: "text-red-700 font-bold", label: "Critical" },
};

const CONFIDENCE_CONFIG = {
  high: { label: "High Confidence", color: "text-green-600" },
  medium: { label: "Medium Confidence", color: "text-yellow-600" },
  low: { label: "Low Confidence", color: "text-red-600" },
};

export default function LegalVerdict({ result, statement }) {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef(null);

  if (!result) return null;

  const {
    verdict,
    confidence,
    short_reason,
    detailed_explanation,
    laws_violated,
    citizen_rights,
    recommended_action,
    severity,
    language,
  } = result;

  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG["UNCLEAR"];
  const VerdictIcon = config.icon;
  const severityConfig = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG["medium"];
  const confidenceConfig = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG["medium"];

  // ─── Copy to Clipboard ────────────────────────────────────
  const handleCopy = () => {
    const text = `
⚖️ LegalSaathi — Legal Check Result
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Statement: "${statement}"

Verdict: ${config.emoji} ${verdict} (${config.labelNp})

Reason: ${short_reason}

${detailed_explanation}

Laws Referenced:
${laws_violated?.map((l) => `• ${l}`).join("\n")}

Your Rights:
${citizen_rights?.map((r) => `• ${r}`).join("\n")}

Recommended Action: ${recommended_action}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇳🇵 LegalSaathi — न्याय सबैको लागि
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success("Verdict copied to clipboard!");
  };

  // ─── Download as PDF ──────────────────────────────────────
  const handleDownload = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>LegalSaathi — Legal Check</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; }
    .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
    .logo { color: #2563eb; font-size: 22px; font-weight: bold; }
    .verdict-box { padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 2px solid; ${
      verdict === "LEGAL"
        ? "background:#f0fdf4; border-color:#86efac;"
        : verdict === "ILLEGAL"
        ? "background:#fef2f2; border-color:#fca5a5;"
        : "background:#fefce8; border-color:#fde047;"
    }}
    .verdict-label { font-size: 32px; font-weight: 900; margin-bottom: 8px; color: ${
      verdict === "LEGAL" ? "#16a34a" : verdict === "ILLEGAL" ? "#dc2626" : "#ca8a04"
    }; }
    .section { margin-bottom: 20px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .section-title { font-size: 14px; font-weight: bold; color: #2563eb; margin-bottom: 10px; text-transform: uppercase; }
    p { color: #374151; line-height: 1.7; margin: 0 0 8px 0; }
    ul { padding-left: 20px; margin: 0; }
    li { color: #374151; line-height: 1.8; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
    .statement-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-style: italic; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">⚖️ LegalSaathi</div>
      <div style="color:#666; font-size:13px;">Legal Check Report · ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="statement-box">
    <strong>Statement Checked:</strong> "${statement}"
  </div>

  <div class="verdict-box">
    <div class="verdict-label">${config.emoji} ${verdict}</div>
    <p style="font-size:16px; margin:0;">${short_reason}</p>
  </div>

  <div class="section">
    <div class="section-title">📋 Detailed Explanation</div>
    <p>${detailed_explanation}</p>
  </div>

  ${laws_violated?.length > 0 ? `
  <div class="section">
    <div class="section-title">📚 Laws Referenced</div>
    <ul>${laws_violated.map((l) => `<li>${l}</li>`).join("")}</ul>
  </div>` : ""}

  ${citizen_rights?.length > 0 ? `
  <div class="section">
    <div class="section-title">⚖️ Your Rights</div>
    <ul>${citizen_rights.map((r) => `<li>${r}</li>`).join("")}</ul>
  </div>` : ""}

  ${recommended_action ? `
  <div class="section">
    <div class="section-title">🔜 Recommended Action</div>
    <p>${recommended_action}</p>
  </div>` : ""}

  <div class="footer">
    ⚠️ This is general legal information only — not legal advice.<br/>
    Always consult a qualified lawyer for serious legal matters.<br/>
    🇳🇵 LegalSaathi — न्याय सबैको लागि
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    printWindow.onload = () => {
      printWindow.print();
      URL.revokeObjectURL(url);
    };
    toast.success("Opening print dialog — Save as PDF!");
  };

  // ─── Share ────────────────────────────────────────────────
  const handleShare = async () => {
    const shareText = `${config.emoji} "${statement}" — ${verdict} under Nepal Law\n\nChecked using LegalSaathi 🇳🇵\n${short_reason}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "LegalSaathi Legal Check",
          text: shareText,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div ref={cardRef} className="space-y-4">

      {/* ── Main Verdict Card ── */}
      <Card className={`border-2 ${config.border} ${config.bg}`}>
        <CardContent className="pt-6">

          {/* Verdict Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${config.bg} border ${config.border}`}>
                <VerdictIcon className={`w-8 h-8 ${config.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-3xl font-black ${config.color}`}>
                    {verdict}
                  </span>
                  <Badge className={`text-xs ${config.badge}`}>
                    {config.labelNp}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs font-medium ${confidenceConfig.color}`}>
                    {confidenceConfig.label}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className={`text-xs font-medium ${severityConfig.color}`}>
                    {severityConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-1.5 text-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </Button>
            </div>
          </div>

          {/* Statement */}
          <div className="bg-background/60 rounded-xl px-4 py-3 mb-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">
              Statement Checked
            </p>
            <p className="text-sm text-foreground italic">"{statement}"</p>
          </div>

          {/* Short Reason */}
          <p className="text-base text-foreground leading-relaxed font-medium">
            {short_reason}
          </p>

        </CardContent>
      </Card>

      {/* ── Expand Toggle ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        {expanded ? (
          <>Hide Details <ChevronUp className="w-4 h-4" /></>
        ) : (
          <>View Full Analysis <ChevronDown className="w-4 h-4" /></>
        )}
      </button>

      {/* ── Expanded Details ── */}
      {expanded && (
        <div className="space-y-4">

          {/* Detailed Explanation */}
          <Card className="border border-border">
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                📋 Detailed Explanation
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {detailed_explanation}
              </p>
            </CardContent>
          </Card>

          {/* Laws Violated/Referenced */}
          {laws_violated?.length > 0 && (
            <Card className="border border-border">
              <CardContent className="pt-5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                  📚 Laws Referenced
                </p>
                <div className="space-y-2">
                  {laws_violated.map((law, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Scale className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{law}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Citizen Rights */}
          {citizen_rights?.length > 0 && (
            <Card className="border border-border">
              <CardContent className="pt-5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                  ⚖️ Your Rights in This Situation
                </p>
                <div className="space-y-2">
                  {citizen_rights.map((right, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Shield className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{right}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Action */}
          {recommended_action && (
            <Card className="border border-primary/30 bg-primary/5">
              <CardContent className="pt-5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">
                  🔜 Recommended Action
                </p>
                <div className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground font-medium leading-relaxed">
                    {recommended_action}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
              This is general legal information only — not legal advice.
              Always consult a qualified lawyer for serious legal matters.
              🇳🇵 LegalSaathi — न्याय सबैको लागि
            </p>
          </div>

        </div>
      )}

    </div>
  );
}