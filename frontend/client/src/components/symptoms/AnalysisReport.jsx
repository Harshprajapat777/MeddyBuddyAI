import { motion } from "framer-motion";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Apple,
  Pill,
  Lightbulb,
} from "lucide-react";

function severityStyle(sev) {
  if (sev === "severe") return "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/30";
  if (sev === "moderate") return "bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)] border-[var(--color-accent)]/40";
  return "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30";
}

function Section({ icon: Icon, title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-[var(--color-text-primary)]">
        <Icon size={14} className="text-[var(--color-accent-hover)]" /> {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-[var(--color-text-primary)] leading-snug flex gap-2">
            <span className="text-[var(--color-text-muted)] mt-1">·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AnalysisReport({ analysis }) {
  if (!analysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card !p-5 space-y-5"
    >
      {/* Urgent banner */}
      {analysis.urgent_care_needed && (
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-[var(--color-error)]/15 border border-[var(--color-error)]/40">
          <AlertOctagon size={18} className="shrink-0 mt-0.5 text-[var(--color-error)]" />
          <div className="text-sm text-[var(--color-error)] leading-snug">
            <strong>This may need urgent attention.</strong> Please contact emergency services or your clinician right away.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[var(--color-accent-hover)]" />
          <h3 className="text-2xl">Your check-in summary</h3>
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full border ${severityStyle(analysis.severity)}`}>
          {analysis.severity?.toUpperCase?.() ?? "MILD"}
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm text-[var(--color-text-primary)] leading-relaxed bg-[var(--color-background)]/60 border border-[var(--color-card-border)] rounded-2xl p-4">
        {analysis.summary}
      </p>

      {/* Three suggestion buckets */}
      <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-4">
        <Section icon={Lightbulb} title="Follow-up" items={analysis.follow_up_suggestions} />
        <Section icon={Pill} title="Medication ideas (OTC)" items={analysis.medication_suggestions} />
        <Section icon={Apple} title="Food & diet" items={analysis.diet_suggestions} />
      </div>

      <div className="text-[11px] text-[var(--color-text-muted)] italic border-t border-[var(--color-card-border)] pt-3">
        Not medical advice. Always speak with a clinician for clinical decisions, and a pharmacist before starting anything new.
      </div>
    </motion.div>
  );
}
