import { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, Minus, Sparkles, AlertTriangle, Loader2, Send, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function trendIcon(t) {
  if (t === "improving") return <TrendingUp size={14} />;
  if (t === "declining") return <TrendingDown size={14} />;
  return <Minus size={14} />;
}

export default function WeeklyReportModal({ open, report, loading, onClose, onSendToCaregiver, caregiverEmail }) {
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState({ state: "idle", text: "" });

  useEffect(() => {
    if (!open) setSendStatus({ state: "idle", text: "" });
  }, [open]);

  async function handleSendToCaregiver() {
    if (!onSendToCaregiver) return;
    setSending(true);
    setSendStatus({ state: "sending", text: "" });
    try {
      const r = await onSendToCaregiver();
      const ok = r?.status === "sent" || r?.result?.ok;
      setSendStatus({
        state: ok ? "ok" : "error",
        text: ok
          ? `Sent to ${r?.to_email ?? caregiverEmail ?? "caregiver"}`
          : r?.detail?.error ?? r?.message ?? "Send failed",
      });
    } catch (err) {
      setSendStatus({ state: "error", text: err?.message ?? "Send failed" });
    } finally {
      setSending(false);
    }
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-[var(--color-dark)]/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-card)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-[var(--color-card-border)]"
          >
            <header className="flex items-center justify-between p-5 border-b border-[var(--color-card-border)]">
              <div>
                <h2 className="text-2xl">Weekly report</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Last 7 days · MeddyBuddy Digital Twin
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--color-background)] transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
                  <Loader2 size={32} className="animate-spin mb-3 text-[var(--color-accent)]" />
                  <p className="text-sm">MeddyBuddy is writing your report…</p>
                </div>
              ) : !report ? (
                <p className="text-sm text-[var(--color-text-muted)] italic">No report available yet.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Stat label="Score" value={`${report.overall_score} / 100`} />
                    <Stat label="Adherence" value={`${report.adherence_pct?.toFixed?.(1) ?? report.adherence_pct}%`} />
                    <Stat
                      label="Trend"
                      value={
                        <span className="inline-flex items-center gap-1 capitalize">
                          {trendIcon(report.trend)} {report.trend}
                        </span>
                      }
                    />
                    <Stat label="Doses" value={`${report.taken} / ${report.expected}`} />
                  </div>

                  {report.wins?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-[var(--color-success)]" /> Wins
                      </h3>
                      <ul className="space-y-1 text-sm text-[var(--color-text-primary)]">
                        {report.wins.map((w, i) => <li key={i}>· {w}</li>)}
                      </ul>
                    </div>
                  )}

                  {report.top_risks?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-[var(--color-accent)]" /> Risks
                      </h3>
                      <ul className="space-y-1 text-sm text-[var(--color-text-primary)]">
                        {report.top_risks.map((r, i) => <li key={i}>· {r}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="prose-llm text-sm bg-[var(--color-card-assistant)] border border-[var(--color-card-border)] rounded-2xl p-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.summary ?? ""}</ReactMarkdown>
                  </div>
                </>
              )}
            </div>

            {!loading && report && (
              <footer className="flex items-center justify-between gap-3 p-4 border-t border-[var(--color-card-border)] bg-[var(--color-background)]/60">
                <div className="text-[12px] text-[var(--color-text-muted)] leading-snug min-w-0">
                  {caregiverEmail
                    ? <>Send this digest to <span className="text-[var(--color-text-primary)]">{caregiverEmail}</span>.</>
                    : <>Add a caregiver email in settings to share this digest.</>}
                  {sendStatus.text && (
                    <span className={`block mt-0.5 ${
                      sendStatus.state === "ok" ? "text-[var(--color-success)]" :
                      sendStatus.state === "error" ? "text-[var(--color-error)]" :
                      "text-[var(--color-text-muted)]"
                    }`}>
                      {sendStatus.state === "ok" ? `✓ ${sendStatus.text}` : sendStatus.text}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSendToCaregiver}
                  disabled={!caregiverEmail || sending || sendStatus.state === "ok"}
                  className="btn-primary !py-2 !px-4 text-sm shrink-0"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> :
                    sendStatus.state === "ok" ? <Check size={14} /> : <Send size={14} />}
                  {sending ? "Sending…" : sendStatus.state === "ok" ? "Sent" : "Send to caregiver"}
                </button>
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-3 rounded-2xl bg-[var(--color-background)] border border-[var(--color-card-border)]">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
        {label}
      </p>
      <p className="text-base font-medium text-[var(--color-text-primary)] mt-1">{value}</p>
    </div>
  );
}
