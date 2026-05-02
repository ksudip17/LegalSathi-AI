"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scale,
  Upload,
  FileText,
  X,
  Loader2,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  analyzeDocument,
  isAuthenticated,
  isTokenExpired,
  logoutUser,
} from "@/lib/api";
import LegalSummary from "@/components/LegalSummary";
import LanguageSelector from "@/components/LanguageSelector";
import LegalDisclaimer from "@/components/LegalDisclaimer";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

const LOADING_STEPS = [
  { id: 1, label: "Uploading document to secure storage..." },
  { id: 2, label: "Extracting text with OCR..." },
  { id: 3, label: "Searching Nepal legal corpus..." },
  { id: 4, label: "Analyzing with AI — this may take a moment..." },
  { id: 5, label: "Preparing your legal summary..." },
];

export default function AnalyzePage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [language, setLanguage] = useState("ne");

  useEffect(() => {
    // Check localStorage token (works in production cross-domain)
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
  }, []);

  // Simulate loading steps for better UX
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }

    const timings = [0, 3000, 8000, 15000, 50000];
    const timers = timings.map((delay, index) =>
      setTimeout(() => setLoadingStep(index + 1), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [loading]);

  const validateFile = (f) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error("Only PDF, JPG, PNG, or WEBP files are accepted.");
      return false;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File size must be under ${MAX_SIZE_MB}MB.`);
      return false;
    }
    return true;
  };

  const handleFileSelect = (f) => {
    if (!f || !validateFile(f)) return;
    setFile(f);
    setResult(null);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, []);

  const handleAnalyze = async () => {
    if (!file) {
      toast.error("Please upload a document first.");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", language);

      const res = await analyzeDocument(formData);

      setResult({
        summary: res.document.analysis.summary,
        rights: res.document.analysis.rights,
        nextSteps: res.document.analysis.nextSteps,
        lawsCited: res.document.analysis.lawsCited,
        riskLevel: res.document.analysis.riskLevel,
        category: res.document.analysis.category,
        language,
      });

      toast.success("Document analyzed successfully!");

    } catch (error) {
      toast.error(error.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Navbar */}
      <nav className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Document Analyzer</h1>
          <p className="text-muted-foreground mt-1">
            Upload any legal document — get a plain-language summary, your rights, and next steps.
          </p>
        </div>

        {/* Language Selector */}
        <div className="mb-6">
          <LanguageSelector value={language} onChange={setLanguage} variant="pills" />
        </div>

        {/* Upload Zone */}
        <Card className="border border-border mb-6">
          <CardContent className="pt-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary hover:bg-muted/40"
              }`}
              onClick={() => !file && !loading && document.getElementById("fileInput").click()}
            >
              <input
                id="fileInput"
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {!loading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setResult(null);
                      }}
                      className="ml-4 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-1">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, PNG, WEBP — Max {MAX_SIZE_MB}MB
                  </p>
                </>
              )}
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleAnalyze}
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Analyze Document
                </>
              )}
            </Button>

            {/* ── Loading Steps Progress ── */}
            {loading && (
              <div className="mt-6 space-y-2">
                {LOADING_STEPS.map((step, index) => {
                  const isComplete = loadingStep > index + 1;
                  const isCurrent = loadingStep === index + 1;
                  const isPending = loadingStep < index + 1;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        isCurrent ? "bg-primary/10" : ""
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          isComplete
                            ? "text-green-600 line-through opacity-60"
                            : isCurrent
                            ? "text-primary font-medium"
                            : "text-muted-foreground opacity-40"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

          </CardContent>
        </Card>

        {/* Results */}
        {result && <LegalSummary result={result} />}

      </div>
    </div>
  );
}