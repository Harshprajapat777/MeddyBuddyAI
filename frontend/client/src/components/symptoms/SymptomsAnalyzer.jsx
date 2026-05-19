import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, HeartPulse, Loader2, Sparkles } from "lucide-react";
import { api } from "../../api/client";
import MessageBubble from "../chat/MessageBubble";
import TypingIndicator from "../chat/TypingIndicator";
import MessageInput from "../chat/MessageInput";
import AnalysisReport from "./AnalysisReport";
import FileUploadPanel from "./FileUploadPanel";

const WELCOME = {
  role: "assistant",
  content:
    "Hi — let's do a quick check-in. I'll ask **2–3 short questions** about how you're feeling, then I'll put together a short summary with suggestions for follow-ups, OTC ideas, and food / diet that might help. You can also upload a PDF report or a photo on the right.",
};

const SUGGESTIONS = [
  "I've had a sore throat for two days",
  "Feeling anxious and tired",
  "Mild headache and trouble sleeping",
  "Skin rash on my arm",
];

export default function SymptomsAnalyzer({ onBack }) {
  const [messages, setMessages] = useState([WELCOME]);
  const [sending, setSending] = useState(false);
  const [readyForAnalysis, setReadyForAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  // Reset server-side history when this page mounts so each visit is fresh.
  useEffect(() => {
    api.symptomsClear().catch(() => {});
  }, []);

  async function handleSend(text) {
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    try {
      const data = await api.symptomsChat(text);
      const reply = data?.response ?? "_(Empty response.)_";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      if (data?.ready_for_analysis) setReadyForAnalysis(true);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `⚠️ Couldn't reach the agent: \`${err?.message ?? "unknown"}\`.`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalyzeError("");
    setAnalysis(null);
    try {
      const data = await api.symptomsAnalyze();
      setAnalysis(data);
    } catch (err) {
      setAnalyzeError(err?.message ?? "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAnalyzeFile(b64, mime, filename) {
    return await api.analyzeHealthFile(b64, mime, filename);
  }

  async function handleReset() {
    setMessages([WELCOME]);
    setReadyForAnalysis(false);
    setAnalysis(null);
    setAnalyzeError("");
    try { await api.symptomsClear(); } catch (_) {}
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      {/* Page header */}
      <header className="sticky top-0 z-20 bg-[var(--color-background)]/85 backdrop-blur-md border-b border-[var(--color-card-border)]">
        <div className="container-max px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] transition-colors shrink-0"
              title="Back to MeddyBuddy"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-9 h-9 rounded-xl bg-[var(--color-dark)] flex items-center justify-center shrink-0">
              <HeartPulse size={18} className="text-[var(--color-accent-light)]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl leading-none truncate">Symptoms & Mood Analyzer</h1>
              <p className="text-[11px] text-[var(--color-text-muted)] leading-none mt-1 truncate">
                A short check-in agent · separate from your medication chat
              </p>
            </div>
          </div>
          {(messages.length > 1 || analysis || readyForAnalysis) && (
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary !py-2 !px-4 text-sm shrink-0"
            >
              New check-in
            </button>
          )}
        </div>
      </header>

      {/* Intro */}
      <main className="flex-1 container-max w-full px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto mb-6 text-center"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-card)] border border-[var(--color-card-border)] text-xs font-medium text-[var(--color-text-muted)] mb-3">
            <Sparkles size={11} className="text-[var(--color-accent-hover)]" />
            Isolated flow · 2–3 questions · then a structured plan
          </span>
          <h2 className="text-3xl sm:text-4xl text-[var(--color-text-primary)]">
            Tell me how you're feeling.
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-xl mx-auto">
            A focused mood + symptom check-in. Get follow-up suggestions, OTC ideas, and food / diet
            tips in under a minute. You can also upload a PDF report or a skin photo and I'll triage it.
          </p>
        </motion.div>

        {/* Two-column layout: chat on the left, upload + analysis on the right */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Chat column */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="card !p-0 flex-1 flex flex-col overflow-hidden min-h-[420px]">
              <div className="px-4 sm:px-5 py-2.5 border-b border-[var(--color-card-border)] flex items-center justify-between gap-3 bg-[var(--color-card)]/60">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                  <span className="text-xs text-[var(--color-text-muted)] truncate">
                    Symptom intake · Claude Sonnet 4.6
                  </span>
                </div>
                {readyForAnalysis && !analysis && (
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="btn-primary !py-1.5 !px-3 text-xs"
                  >
                    {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {analyzing ? "Analyzing…" : "Analyze my answers"}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 max-h-[55vh]">
                {messages.map((m, i) => (
                  <MessageBubble key={i} role={m.role} content={m.content} />
                ))}
                {sending && <TypingIndicator />}
              </div>

              <div className="border-t border-[var(--color-card-border)] p-3 sm:p-4 bg-[var(--color-card)]">
                <MessageInput
                  onSend={handleSend}
                  disabled={sending}
                  showSuggestions={messages.length <= 1}
                  suggestions={SUGGESTIONS}
                  placeholder="Tell me how you're feeling…"
                />
              </div>
            </div>
          </div>

          {/* Right column: upload + analysis */}
          <div className="w-full lg:w-[400px] shrink-0 space-y-4">
            <FileUploadPanel onAnalyze={handleAnalyzeFile} />

            <AnimatePresence>
              {analyzeError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-[var(--color-error)] p-3 rounded-2xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/30"
                >
                  {analyzeError}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {analysis && <AnalysisReport analysis={analysis} />}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
