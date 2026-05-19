import { TrendingUp, TrendingDown, Minus, Sparkles, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

function trendIcon(trend) {
  if (trend === "improving") return <TrendingUp size={14} />;
  if (trend === "declining") return <TrendingDown size={14} />;
  return <Minus size={14} />;
}

function trendColor(trend) {
  if (trend === "improving") return "text-[var(--color-success)]";
  if (trend === "declining") return "text-[var(--color-error)]";
  return "text-[var(--color-text-muted)]";
}

function scoreColor(score) {
  if (score >= 85) return "text-[var(--color-success)]";
  if (score >= 60) return "text-[var(--color-accent)]";
  return "text-[var(--color-error)]";
}

export default function HealthScoreCard({ healthScore }) {
  if (!healthScore) return null;
  const { score, trend, adherence_pct, top_risks = [], wins = [] } = healthScore;

  return (
    <div className="card !p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
            Health score
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <motion.span
              key={score}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`text-4xl font-serif ${scoreColor(score)}`}
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {score}
            </motion.span>
            <span className="text-sm text-[var(--color-text-muted)]">/ 100</span>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor(trend)}`}>
          {trendIcon(trend)}
          <span className="capitalize">{trend}</span>
        </div>
      </div>

      <div className="text-xs text-[var(--color-text-muted)] mb-3">
        7-day adherence: <span className="text-[var(--color-text-primary)] font-medium">{adherence_pct?.toFixed?.(1) ?? adherence_pct}%</span>
      </div>

      <div className="h-1.5 w-full bg-[var(--color-background)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-[var(--color-accent-light)] to-[var(--color-accent)] rounded-full"
        />
      </div>

      {wins.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {wins.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-primary)]">
              <Sparkles size={12} className="shrink-0 mt-0.5 text-[var(--color-success)]" />
              <span className="leading-snug">{w}</span>
            </div>
          ))}
        </div>
      )}

      {top_risks.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {top_risks.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-primary)]">
              <AlertTriangle size={12} className="shrink-0 mt-0.5 text-[var(--color-accent)]" />
              <span className="leading-snug">{r}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
