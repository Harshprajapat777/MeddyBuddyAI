import { AlertTriangle, Info, AlertOctagon, Check, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function severityIcon(sev) {
  if (sev === "high") return <AlertOctagon size={14} />;
  if (sev === "warning") return <AlertTriangle size={14} />;
  return <Info size={14} />;
}

function severityClasses(sev) {
  if (sev === "high") return "bg-[var(--color-error)]/10 text-[var(--color-error)]";
  if (sev === "warning") return "bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)]";
  return "bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]";
}

export default function AlertsInbox({ alerts = [], onAcknowledge, onRefresh }) {
  const open = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="card !p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-[var(--color-text-muted)]" />
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
            Proactive alerts
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            refresh
          </button>
        )}
      </div>

      {open.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)] italic">
          All clear — no proactive alerts right now.
        </p>
      ) : (
        <ul className="space-y-2.5">
          <AnimatePresence>
            {open.map((a) => (
              <motion.li
                key={a.alert_id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="p-3 rounded-2xl bg-[var(--color-background)]/60 border border-[var(--color-card-border)]/70"
              >
                <div className="flex items-start gap-2">
                  <span className={`shrink-0 mt-0.5 p-1.5 rounded-full ${severityClasses(a.severity)}`}>
                    {severityIcon(a.severity)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] leading-snug">
                      {a.message}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1 leading-snug">
                      {a.suggested_action}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAcknowledge?.(a.alert_id)}
                  className="mt-2 w-full py-1.5 text-[11px] rounded-full bg-[var(--color-background)] border border-[var(--color-card-border)] hover:border-[var(--color-accent)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] transition-colors flex items-center justify-center gap-1"
                >
                  <Check size={11} /> Acknowledge
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
