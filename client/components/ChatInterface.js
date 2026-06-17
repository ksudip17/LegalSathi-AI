"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  User,
  Send,
  Loader2,
  Copy,
  RotateCcw,
  Mic,
  MicOff,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Props:
// messages          — array of { id, role, content, timestamp, laws? }
// onSend(text)      — called when user sends a message
// onReset()         — called when chat is reset
// loading           — boolean, true while waiting for AI response
// language          — "ne" | "hi" | "en"
// onLanguageChange  — callback(lang)
// suggestions       — string[] of suggested questions

const LANGUAGE_OPTIONS = [
  { code: "ne", label: "नेपाली" },
  { code: "hi", label: "हिंदी" },
  { code: "en", label: "English" },
];

// REPLACE with this
const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

// Render **bold** markdown inline
const renderContent = (content) => {
  return content.split("\n").map((line, i) => {
    const formatted = line.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );
    return (
      <p
        key={i}
        className="leading-relaxed min-h-[1rem]"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  });
};

// Single message bubble
const MessageBubble = ({ message, onCopy }) => {
  const [feedback, setFeedback] = useState(null);
  const isAssistant = message.role === "assistant";

  const handleFeedback = (type) => {
    setFeedback(type);
    toast.success(type === "up" ? "Thanks for the feedback!" : "We'll improve this answer.");
  };

  return (
    <div className={`flex gap-3 ${isAssistant ? "flex-row" : "flex-row-reverse"}`}>

      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
          isAssistant
            ? "legal-gradient"
            : "bg-muted border border-border"
        }`}
      >
        {isAssistant ? (
          <Bot className="w-4 h-4 text-white" />
        ) : (
          <User className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] space-y-2`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm space-y-1 ${
            isAssistant
              ? "bg-muted text-foreground rounded-tl-sm"
              : "bg-primary text-primary-foreground rounded-tr-sm"
          }`}
        >
          {renderContent(message.content)}

          {/* Laws cited */}
          {message.laws && message.laws.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1 pt-2 border-t border-border/30">
              {message.laws.map((law, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs py-0.5"
                >
                   {law}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp + Actions */}
        <div
          className={`flex items-center gap-2 px-1 ${
            isAssistant ? "flex-row" : "flex-row-reverse"
          }`}
        >
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>

          {isAssistant && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onCopy(message.content)}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                title="Copy response"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleFeedback("up")}
                className={`p-1 rounded transition-colors ${
                  feedback === "up"
                    ? "text-green-500"
                    : "text-muted-foreground hover:text-green-500"
                }`}
                title="Good answer"
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleFeedback("down")}
                className={`p-1 rounded transition-colors ${
                  feedback === "down"
                    ? "text-red-500"
                    : "text-muted-foreground hover:text-red-500"
                }`}
                title="Bad answer"
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Typing indicator
const TypingIndicator = () => (
  <div className="flex gap-3">
    <div className="w-8 h-8 rounded-full legal-gradient flex items-center justify-center shrink-0">
      <Bot className="w-4 h-4 text-white" />
    </div>
    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex items-center gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  </div>
);

export default function ChatInterface({
  messages = [],
  onSend,
  onReset,
  loading = false,
  language = "ne",
  onLanguageChange,
  suggestions = [],
}) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    onSend?.(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (q) => {
    if (loading) return;
    onSend?.(q);
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  const handleReset = () => {
    setInput("");
    onReset?.();
  };

  const toggleRecording = () => {
    // TODO: Wire to Whisper API in Phase 3
    if (isRecording) {
      setIsRecording(false);
      toast.info("Recording stopped.");
    } else {
      setIsRecording(true);
      toast.info("Voice input coming soon!");
      setTimeout(() => setIsRecording(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full">

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4 shrink-0">

        {/* Language Selector */}
        <div className="flex items-center gap-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageChange?.(lang.code)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                language === lang.code
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Chat
        </button>
      </div>

      {/* Suggested Questions — only when no user messages yet */}
      {suggestions.length > 0 && messages.length <= 1 && (
        <div className="mb-5 shrink-0">
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            Suggested Questions
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSuggestion(q)}
                disabled={loading}
                className="text-xs px-3 py-2 rounded-lg border border-border hover:border-primary hover:text-primary text-muted-foreground transition-all disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 mb-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCopy={handleCopy}
          />
        ))}

        {loading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 border border-border rounded-2xl p-3 bg-background shadow-sm focus-within:border-primary transition-colors">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            language === "ne"
              ? "यहाँ आफ्नो प्रश्न लेख्नुहोस्... (Shift+Enter = नयाँ लाइन)"
              : language === "hi"
              ? "यहाँ अपना प्रश्न लिखें... (Shift+Enter = नई लाइन)"
              : "Type your legal question here... (Shift+Enter = new line)"
          }
          className="border-0 shadow-none resize-none focus-visible:ring-0 text-sm min-h-[60px] max-h-[160px] p-0 bg-transparent"
          disabled={loading}
        />

        <div className="flex items-center justify-between mt-2">
          <button
            onClick={toggleRecording}
            className={`p-2 rounded-lg transition-colors ${
              isRecording
                ? "text-destructive bg-destructive/10 animate-pulse"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title={isRecording ? "Stop recording" : "Voice input"}
          >
            {isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          <div className="flex items-center gap-3">
            {input.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {input.length} chars
              </span>
            )}
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="gap-2 rounded-xl px-4"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Send <Send className="w-3 h-3" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
      