import { Pill, LogOut, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function Header({ username, onSignOut, onOpenWeeklyReport }) {
  return (
    <header className="sticky top-0 z-20 bg-[var(--color-background)]/85 backdrop-blur-md border-b border-[var(--color-card-border)]">
      <div className="container-max px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
            className="w-9 h-9 rounded-xl bg-[var(--color-dark)] flex items-center justify-center"
          >
            <Pill size={18} className="text-[var(--color-accent-light)]" />
          </motion.div>
          <div>
            <h1 className="text-xl leading-none">MeddyBuddy</h1>
            <p className="text-[11px] text-[var(--color-text-muted)] leading-none mt-1">
              Agentic AI · JacHacks Spring 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenWeeklyReport}
            className="btn-secondary !py-2 !px-4 text-sm"
            title="Weekly report"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">Weekly report</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-card)] border border-[var(--color-card-border)]">
            <div className="w-7 h-7 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-xs font-semibold">
              {(username || "U").charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">{username}</span>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
