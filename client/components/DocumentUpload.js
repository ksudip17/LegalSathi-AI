"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

// Props:
// onFileReady(file)   — called when a valid file is selected
// onAnalyze(file)     — called when Analyze button is clicked
// loading             — boolean, disables UI during API call
// analysisComplete    — boolean, shows success state

export default function DocumentUpload({
  onFileReady,
  onAnalyze,
  loading = false,
  analysisComplete = false,
}) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);

  const validateFile = (f) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(f.type)) {
      const msg = "Only PDF, JPG, PNG, or WEBP files are accepted.";
      setError(msg);
      toast.error(msg);
      return false;
    }

    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      const msg = `File must be under ${MAX_SIZE_MB}MB. Your file: ${(f.size / 1024 / 1024).toFixed(1)}MB`;
      setError(msg);
      toast.error(msg);
      return false;
    }

    return true;
  };

  const handleFileSelect = (f) => {
    if (!f || !validateFile(f)) return;
    setFile(f);
    onFileReady?.(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFileSelect(f);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
    onFileReady?.(null);
  };

  const handleAnalyzeClick = () => {
    if (!file) {
      toast.error("Please select a document first.");
      return;
    }
    onAnalyze?.(file);
  };

  // Derive upload zone state
  const zoneState = () => {
    if (error) return "error";
    if (analysisComplete) return "success";
    if (file) return "ready";
    if (dragOver) return "dragover";
    return "idle";
  };

  const zoneStyles = {
    idle: "border-border hover:border-primary hover:bg-muted/40",
    dragover: "border-primary bg-primary/5 scale-[1.01]",
    ready: "border-primary bg-primary/5",
    success: "border-green-500 bg-green-50 dark:bg-green-950/30",
    error: "border-destructive bg-destructive/5",
  };

  const state = zoneState();

  return (
    <div className="w-full space-y-4">

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() =>
          !file && !loading && document.getElementById("doc-upload-input").click()
        }
        className={`
          border-2 border-dashed rounded-2xl p-10 text-center 
          transition-all duration-200 select-none
          ${!file && !loading ? "cursor-pointer" : "cursor-default"}
          ${zoneStyles[state]}
        `}
      >
        <input
          id="doc-upload-input"
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          disabled={loading}
        />

        {/* idle state */}
        {state === "idle" && (
          <>
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-semibold text-lg mb-1">
              Drag & drop your document here
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              or click to browse files
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {["PDF", "JPG", "PNG", "WEBP"].map((type) => (
                <span
                  key={type}
                  className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground font-mono"
                >
                  .{type.toLowerCase()}
                </span>
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                · Max {MAX_SIZE_MB}MB
              </span>
            </div>
          </>
        )}

        {/* dragover state */}
        {state === "dragover" && (
          <>
            <Upload className="w-12 h-12 text-primary mx-auto mb-4 animate-bounce" />
            <p className="text-primary font-semibold text-lg">
              Drop it here!
            </p>
          </>
        )}

        {/* file ready state */}
        {(state === "ready" || state === "success") && file && (
          <div className="flex items-center justify-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                state === "success" ? "bg-green-100 dark:bg-green-900" : "bg-primary/10"
              }`}
            >
              {state === "success" ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <FileText className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                {file.type === "application/pdf" ? "PDF Document" : "Image File"}
              </p>
              {state === "success" && (
                <p className="text-xs text-green-600 font-medium mt-0.5">
                  ✓ Analysis complete
                </p>
              )}
            </div>
            {!loading && (
              <button
                onClick={handleRemove}
                className="ml-2 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* error state */}
        {state === "error" && (
          <>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-semibold mb-1">Upload Failed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={(e) => {
                e.stopPropagation();
                setError(null);
                setFile(null);
                document.getElementById("doc-upload-input").click();
              }}
            >
              Try Again
            </Button>
          </>
        )}

      </div>

      {/* Analyze Button */}
      {file && state !== "error" && (
        <Button
          className="w-full"
          size="lg"
          onClick={handleAnalyzeClick}
          disabled={loading || analysisComplete}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Document...
            </>
          ) : analysisComplete ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
              Analysis Complete
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Analyze Document
            </>
          )}
        </Button>
      )}

    </div>
  );
}