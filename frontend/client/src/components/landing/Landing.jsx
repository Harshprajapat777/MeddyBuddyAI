import { motion } from "framer-motion";
import {
  Pill,
  Sparkles,
  Activity,
  Bell,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Conversational agent",
    body: "Talk to MeddyBuddy in plain English. It picks the right tool — log a dose, check an interaction, summarize your week — and writes back like a careful friend.",
  },
  {
    icon: Activity,
    title: "Digital health twin",
    body: "A 0–100 score that learns from your routine. Adherence, trend, top risks, wins. Updated every time the agent or you touch your graph.",
  },
  {
    icon: Bell,
    title: "Proactive alerts",
    body: "Notices when adherence drops and surfaces a small, specific next step — before the slip becomes a habit.",
  },
];

export default function Landing({ onGetStarted, onSignIn }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[var(--color-background)]">
      {/* Soft floating background blobs */}
      <motion.div
        aria-hidden
        className="absolute -top-40 -left-32 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle, #C4956A 0%, transparent 70%)" }}
        animate={{ x: [0, 30, 0], y: [0, 24, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 -right-40 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, #D4A87A 0%, transparent 70%)" }}
        animate={{ x: [0, -24, 0], y: [0, -32, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Top nav */}
      <header className="relative z-10 container-max px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, -6, 6, -4, 4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
            className="w-9 h-9 rounded-xl bg-[var(--color-dark)] flex items-center justify-center"
          >
            <Pill size={18} className="text-[var(--color-accent-light)]" />
          </motion.div>
          <span className="text-lg">MeddyBuddy</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/Harshprajapat777/MeddyBuddyAI"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ExternalLink size={14} /> GitHub
          </a>
          <button type="button" onClick={onSignIn} className="btn-secondary !py-2 !px-4 text-sm">
            Sign in
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 container-max px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-card)] border border-[var(--color-card-border)] text-xs font-medium text-[var(--color-text-muted)] mb-6">
            <ShieldCheck size={12} className="text-[var(--color-accent-hover)]" />
            JacHacks Spring 2026 · Agentic AI flagship track
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-[var(--color-text-primary)] tracking-tight">
            The proactive AI <em className="italic text-[var(--color-accent-hover)]">companion</em> for your medications.
          </h1>

          <p className="mt-6 text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto leading-relaxed">
            MeddyBuddy tracks your meds, learns your rhythm, and tells you when something's slipping —
            <span className="text-[var(--color-text-primary)] font-medium"> before you ask</span>.
            Built on Jac 2.0 + Claude Sonnet 4.6.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={onGetStarted} className="btn-primary">
              Get started <ArrowRight size={16} />
            </button>
            <button type="button" onClick={onSignIn} className="btn-secondary">
              I already have an account
            </button>
          </div>

          <p className="mt-5 text-xs text-[var(--color-text-muted)]">
            No card, no tracking. Local-first demo for the hackathon.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="mt-20 lg:mt-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-light)]/30 flex items-center justify-center mb-3">
                <f.icon size={18} className="text-[var(--color-accent-hover)]" />
              </div>
              <h3 className="text-xl mb-1.5">{f.title}</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>

        {/* Mini "how it works" strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 lg:mt-20 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-sm text-[var(--color-text-muted)]"
        >
          <Step n={1} label="Sign up in a tap" />
          <Divider />
          <Step n={2} label="Tell MeddyBuddy your meds" />
          <Divider />
          <Step n={3} label="Chat naturally — log, ask, plan" />
          <Divider />
          <Step n={4} label="Get a weekly report" />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 container-max px-4 sm:px-6 lg:px-8 py-8 text-center text-xs text-[var(--color-text-muted)]">
        Built with Jac 2.0 + byLLM + Claude Sonnet 4.6 · Not medical advice — always talk to a clinician.
      </footer>
    </div>
  );
}

function Step({ n, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-[var(--color-dark)] text-white text-[11px] font-medium flex items-center justify-center">
        {n}
      </span>
      <span>{label}</span>
    </span>
  );
}

function Divider() {
  return <span className="hidden sm:inline w-6 h-px bg-[var(--color-card-border)]" />;
}
