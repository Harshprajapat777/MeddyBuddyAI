import { Pill, Check, X, Clock, Plus, Bell, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

function freqLabel(freq) {
  return ({
    daily: "Daily",
    twice_daily: "Twice daily",
    three_times_daily: "Three times daily",
    as_needed: "As needed",
    weekly: "Weekly",
  })[freq] ?? freq;
}

export default function MedicationList({ medications = [], onLogTaken, onLogSkipped, onAdd, onSendReminder }) {
  const [sendingId, setSendingId] = useState(null);
  const [sentMap, setSentMap] = useState({});

  async function handleRemind(med_name) {
    if (!onSendReminder) return;
    setSendingId(med_name);
    try {
      const r = await onSendReminder(med_name);
      const ok = r?.status === "sent" || r?.detail?.ok;
      setSentMap((m) => ({ ...m, [med_name]: ok ? "ok" : "error" }));
      setTimeout(() => setSentMap((m) => {
        const { [med_name]: _gone, ...rest } = m;
        return rest;
      }), 3000);
    } catch (err) {
      setSentMap((m) => ({ ...m, [med_name]: "error" }));
    } finally {
      setSendingId(null);
    }
  }
  return (
    <div className="card !p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
            Medications
          </p>
          <p className="text-sm text-[var(--color-text-primary)] mt-0.5">
            {medications.length} active
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="p-1.5 rounded-full bg-[var(--color-background)] border border-[var(--color-card-border)] hover:border-[var(--color-accent)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
          title="Add medication"
        >
          <Plus size={14} />
        </button>
      </div>

      {medications.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)] italic">
          No medications yet. Say <em>"add aspirin 81mg daily"</em> in chat — MeddyBuddy will set it up.
        </p>
      ) : (
        <ul className="space-y-2.5">
          <AnimatePresence>
            {medications.map((med) => (
              <motion.li
                key={med.med_name}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="group p-3 rounded-2xl bg-[var(--color-background)]/60 border border-[var(--color-card-border)]/70 hover:border-[var(--color-accent)] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--color-accent-light)]/30 flex items-center justify-center">
                    <Pill size={14} className="text-[var(--color-accent-hover)]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-[var(--color-text-primary)] truncate">
                        {med.med_name}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                        {med.dosage}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                      <Clock size={10} />
                      <span>{freqLabel(med.frequency)} · {med.times?.join(", ") ?? "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onLogTaken?.(med.med_name)}
                    className="flex-1 py-1.5 text-[11px] rounded-full bg-[var(--color-success)]/10 hover:bg-[var(--color-success)]/20 text-[var(--color-success)] font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Check size={11} /> Taken
                  </button>
                  <button
                    type="button"
                    onClick={() => onLogSkipped?.(med.med_name)}
                    className="flex-1 py-1.5 text-[11px] rounded-full bg-[var(--color-text-muted)]/10 hover:bg-[var(--color-text-muted)]/20 text-[var(--color-text-muted)] font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <X size={11} /> Skip
                  </button>
                  {onSendReminder && (
                    <button
                      type="button"
                      onClick={() => handleRemind(med.med_name)}
                      disabled={sendingId === med.med_name}
                      className="py-1.5 px-2.5 text-[11px] rounded-full bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 text-[var(--color-accent-hover)] font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                      title="Send a test reminder email"
                    >
                      {sendingId === med.med_name
                        ? <Loader2 size={11} className="animate-spin" />
                        : sentMap[med.med_name] === "ok"
                          ? <Check size={11} />
                          : <Bell size={11} />}
                    </button>
                  )}
                </div>
                {sentMap[med.med_name] && (
                  <p className={`text-[10px] mt-1.5 text-right ${
                    sentMap[med.med_name] === "ok"
                      ? "text-[var(--color-success)]"
                      : "text-[var(--color-error)]"
                  }`}>
                    {sentMap[med.med_name] === "ok" ? "Reminder sent ✓" : "Send failed"}
                  </p>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
