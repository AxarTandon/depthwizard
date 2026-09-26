"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageCircle, X, Send, Languages, Sparkles } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { sendChatMessage, getProjects, translateText } from "@/lib/api";
import { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { VoiceInput } from "./VoiceInput";

const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi (हिंदी)" },
  { code: "bn", label: "Bengali (বাংলা)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "te", label: "Telugu (తెలుగు)" },
];

const DEFAULT_GREETING = "Ask me about this project's terrain, flood risk, building damage, or format comparison (e.g. H5 vs PNG).";

export function ChatbotWidget({ projectId = null }: { projectId?: string | null }) {
  const searchParams = useSearchParams();
  const rawProjectId = projectId ?? searchParams?.get("project") ?? null;

  const [activeProjectId, setActiveProjectId] = useState<string | null>(rawProjectId);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: DEFAULT_GREETING,
      timestamp: new Date().toISOString(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-resolve completed project if not explicitly provided
  useEffect(() => {
    let cancelled = false;
    async function resolveProject() {
      if (rawProjectId && rawProjectId !== "proj-demo") {
        setActiveProjectId(rawProjectId);
        return;
      }
      try {
        const projs = await getProjects();
        if (cancelled) return;
        const completed = projs.find((p) => p.status === "complete") || projs[0];
        if (completed) {
          setActiveProjectId(completed.id);
          setActiveProjectName(completed.name);
        }
      } catch {
        // Fallback
      }
    }
    resolveProject();
    return () => {
      cancelled = true;
    };
  }, [rawProjectId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function handleLanguageChange(newLang: string) {
    setLanguage(newLang);
    // If only initial greeting is present, translate it immediately
    if (messages.length === 1 && messages[0].role === "assistant") {
      setTranslating(true);
      try {
        const translated = await translateText(DEFAULT_GREETING, newLang);
        setMessages([
          {
            role: "assistant",
            text: translated,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch {
        // Keep existing
      } finally {
        setTranslating(false);
      }
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text, timestamp: new Date().toISOString() }]);
    setSending(true);
    try {
      const response = await sendChatMessage(activeProjectId, text, language);
      setMessages((prev) => [...prev, response]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <Panel className="mb-3 flex h-[430px] w-88 sm:w-96 flex-col overflow-hidden shadow-2xl border border-line">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line bg-surface-raised px-4 py-2.5">
            <div className="flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-signal-cyan shrink-0" />
                <span className="text-[13px] font-medium text-ink truncate">Depthwizard AI</span>
              </div>
              {activeProjectName && (
                <span className="font-mono text-[10.5px] text-signal-cyan truncate">
                  {activeProjectName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Languages className="h-3.5 w-3.5 text-ink-faint" strokeWidth={1.75} />
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="rounded-sm border border-line-bright bg-surface-panel px-2 py-1 text-[11px] text-ink outline-none focus:border-signal-cyan"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-ink-faint hover:text-ink transition-colors"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-[12.5px]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[88%] rounded px-3 py-2.5 leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-signal-cyan/15 text-ink border border-signal-cyan/30"
                    : "bg-surface-raised text-ink border border-line/60"
                )}
              >
                {m.text}
              </div>
            ))}
            {(sending || translating) && (
              <div className="flex items-center gap-2 text-[12px] text-signal-cyan animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-cyan animate-ping" />
                {translating ? "Translating…" : "Analyzing terrain context…"}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="flex items-center gap-2 border-t border-line bg-surface-raised/50 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about terrain, flood, H5 vs PNG…"
              className="h-9 flex-1 rounded-sm border border-line-bright bg-surface-panel px-3 text-[12.5px] text-ink placeholder:text-ink-faint outline-none focus:border-signal-cyan"
            />
            <VoiceInput
              projectId={activeProjectId}
              onResult={(userMsg, botMsg) => setMessages((prev) => [...prev, userMsg, botMsg])}
            />
            <Button size="sm" onClick={handleSend} disabled={sending || !input.trim()}>
              <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Button>
          </div>
        </Panel>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex h-12 w-12 items-center justify-center rounded-full bg-signal-cyan text-void shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Open Depthwizard assistant"
      >
        {open ? <X className="h-5 w-5" strokeWidth={2} /> : <MessageCircle className="h-5 w-5" strokeWidth={2} />}
      </button>
    </div>
  );
}

