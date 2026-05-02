"use client";

import { useState } from "react";
import { Globe, Check } from "lucide-react";

// Props:
// value              — current language code "ne" | "hi" | "en"
// onChange(code)     — called when language changes
// variant            — "pills" | "dropdown" | "flags"  (default: "pills")
// size               — "sm" | "md"  (default: "md")
// label              — show label text (default: true)

const LANGUAGES = [
  {
    code: "ne",
    label: "नेपाली",
    englishLabel: "Nepali",
    flag: "🇳🇵",
  },
  {
    code: "hi",
    label: "हिंदी",
    englishLabel: "Hindi",
    flag: "🇮🇳",
  },
  {
    code: "en",
    label: "English",
    englishLabel: "English",
    flag: "🇬🇧",
  },
];

// ─── Pills Variant ───────────────────────────────────────────
const PillsVariant = ({ value, onChange, size }) => {
  const isSmall = size === "sm";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {LANGUAGES.map((lang) => {
        const isActive = value === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            className={`flex items-center gap-1.5 rounded-full font-medium border transition-all
              ${isSmall ? "text-xs px-3 py-1" : "text-sm px-4 py-1.5"}
              ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground bg-background"
              }
            `}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
            {isActive && <Check className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />}
          </button>
        );
      })}
    </div>
  );
};

// ─── Dropdown Variant ─────────────────────────────────────────
const DropdownVariant = ({ value, onChange, size }) => {
  const [open, setOpen] = useState(false);
  const selected = LANGUAGES.find((l) => l.code === value) || LANGUAGES[0];
  const isSmall = size === "sm";

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 border border-border rounded-lg bg-background hover:border-primary transition-colors
          ${isSmall ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2"}
        `}
      >
        <Globe className={isSmall ? "w-3 h-3 text-muted-foreground" : "w-4 h-4 text-muted-foreground"} />
        <span>{selected.flag}</span>
        <span className="font-medium text-foreground">{selected.label}</span>
        <svg
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""} ${isSmall ? "w-3 h-3" : "w-4 h-4"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown Menu */}
          <div className="absolute top-full mt-2 left-0 z-20 bg-background border border-border rounded-xl shadow-lg overflow-hidden min-w-[160px]">
            {LANGUAGES.map((lang) => {
              const isActive = value === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    onChange(lang.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors
                    ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <div className="text-left">
                      <p className="font-medium leading-none">{lang.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lang.englishLabel}
                      </p>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Flags Variant ────────────────────────────────────────────
const FlagsVariant = ({ value, onChange, size }) => {
  const isSmall = size === "sm";

  return (
    <div className="flex items-center gap-1">
      {LANGUAGES.map((lang) => {
        const isActive = value === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            title={lang.englishLabel}
            className={`rounded-lg transition-all font-medium
              ${isSmall ? "text-base px-2 py-1" : "text-xl px-2.5 py-1.5"}
              ${
                isActive
                  ? "bg-primary/15 ring-2 ring-primary scale-110"
                  : "hover:bg-muted opacity-60 hover:opacity-100"
              }
            `}
          >
            {lang.flag}
          </button>
        );
      })}
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────
export default function LanguageSelector({
  value = "ne",
  onChange,
  variant = "pills",
  size = "md",
  label = true,
}) {
  const renderVariant = () => {
    switch (variant) {
      case "dropdown":
        return <DropdownVariant value={value} onChange={onChange} size={size} />;
      case "flags":
        return <FlagsVariant value={value} onChange={onChange} size={size} />;
      default:
        return <PillsVariant value={value} onChange={onChange} size={size} />;
    }
  };

  return (
    <div className="flex items-center gap-3">
      {label && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">Language:</span>
        </div>
      )}
      {renderVariant()}
    </div>
  );
}