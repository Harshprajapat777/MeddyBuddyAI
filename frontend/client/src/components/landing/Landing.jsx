import { motion } from "framer-motion";
import {
  Pill,
  Sparkles,
  Activity,
  Bell,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  UserPlus,
  MessageCircle,
  HeartHandshake,
  Mail,
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

const HOW_STEPS = [
  {
    icon: UserPlus,
    n: "01",
    title: "Meet your agent — no forms",
    body:
      "The moment you sign up, the onboarding agent says hello and asks for your first medication. You answer in your own words — \"Aspirin 81mg every morning\" — and it sets it up. One question at a time, conversational, never a 14-field form.",
    sampleUser: "Aspirin 81mg every morning",
    sampleAssistant:
      "Got it ✅ — **Aspirin 81mg**, every morning. What's the next one, or is that everything?",
  },
  {
    icon: MessageCircle,
    n: "02",
    title: "Chat naturally — the tools do the rest",
    body:
      "Tell MeddyBuddy what's going on. \"I just took my aspirin.\" \"Is ibuprofen safe with my metformin?\" \"How am I doing this week?\" The agent picks the right tool and replies with structured, sourced information.",
    sampleUser: "I just took my aspirin",
    sampleAssistant:
      "Logged ✅ Aspirin marked **taken at 8:12 AM**. Your adherence is now 92%.",
  },
  {
    icon: Bell,
    n: "03",
    title: "Get reminded — never miss a dose",
    body:
      "When a dose is due, MeddyBuddy emails you a styled reminder. Reply in the chat afterwards and the agent logs it. Your health score updates in real time, and the Digital Twin flags any med where adherence drops below 70%.",
    sampleEmail: {
      subject: "💊 Time for your Metformin 500mg",
      preview: "Hi Sarah — just a gentle reminder, it's time for your 8 PM Metformin…",
    },
  },
  {
    icon: HeartHandshake,
    n: "04",
    title: "Keep your family in the loop",
    body:
      "Add a caregiver email in Settings and they get a polished weekly digest — your meds, score, trend, wins, risks — sent to their inbox. No app to download. Closes the family-care loop without surveillance.",
    sampleEmail: {
      subject: "MeddyBuddy · Sarah's weekly check-in",
      preview: "Score 86 · Adherence 92% · 📈 improving · Aspirin: 95% adherence — strong consistency",
    },
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
            href="#how-it-works"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            How it works
          </a>
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

        {/* How it works — anchor target #how-it-works */}
        <section id="how-it-works" className="mt-24 lg:mt-32 scroll-mt-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 lg:mb-16"
          >
            <span className="inline-block text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] font-medium mb-3">
              How it works
            </span>
            <h2 className="text-4xl sm:text-5xl text-[var(--color-text-primary)]">
              An <em className="italic text-[var(--color-accent-hover)]">agent</em>, not just a tracker.
            </h2>
            <p className="mt-4 text-base text-[var(--color-text-muted)] max-w-xl mx-auto leading-relaxed">
              Four moves the agent makes for you — from the first hello, to the email that lands in your family's inbox.
            </p>
          </motion.div>

          <div className="space-y-6 lg:space-y-8 max-w-5xl mx-auto">
            {HOW_STEPS.map((step, i) => {
              const reverse = i % 2 === 1;
              return (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={`grid lg:grid-cols-2 gap-6 lg:gap-10 items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
                >
                  {/* Text side */}
                  <div className={`${reverse ? "lg:pl-6" : "lg:pr-6"}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-dark)] text-[var(--color-accent-light)]">
                        <step.icon size={18} />
                      </span>
                      <span className="text-xs font-medium tracking-[0.15em] text-[var(--color-text-muted)]">
                        STEP {step.n}
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl leading-tight text-[var(--color-text-primary)]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
                      {step.body}
                    </p>
                  </div>

                  {/* Visual side */}
                  <div className="lg:max-w-md w-full mx-auto">
                    {step.sampleUser ? (
                      <ChatPreview user={step.sampleUser} assistant={step.sampleAssistant} />
                    ) : step.sampleEmail ? (
                      <EmailPreview subject={step.sampleEmail.subject} preview={step.sampleEmail.preview} />
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Closing CTA after how-it-works */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-16 lg:mt-20 text-center"
          >
            <button type="button" onClick={onGetStarted} className="btn-primary">
              Try it — set up your meds in 60 seconds <ArrowRight size={16} />
            </button>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              No credit card. Backend on your machine. Stop the demo any time.
            </p>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 container-max px-4 sm:px-6 lg:px-8 py-8 text-center text-xs text-[var(--color-text-muted)]">
        Built with Jac 2.0 + byLLM + Claude Sonnet 4.6 · Not medical advice — always talk to a clinician.
      </footer>
    </div>
  );
}

/* ─── How-it-works visuals ────────────────────────────────────────────── */

function ChatPreview({ user, assistant }) {
  return (
    <div className="card !p-4 space-y-3">
      <div className="flex gap-2 justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-[var(--color-dark)] text-white px-3 py-2 text-sm shadow-sm">
          {user}
        </div>
      </div>
      <div className="flex gap-2 items-start">
        <div className="w-7 h-7 shrink-0 rounded-full bg-[var(--color-dark)] flex items-center justify-center mt-1">
          <Pill size={12} className="text-[var(--color-accent-light)]" />
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-[var(--color-card-assistant)] border border-[var(--color-card-border)] text-[var(--color-text-primary)] px-3 py-2 text-sm leading-snug">
          {renderMarkdownLite(assistant)}
        </div>
      </div>
    </div>
  );
}

function EmailPreview({ subject, preview }) {
  return (
    <div className="card !p-4">
      <div className="flex items-center gap-2 mb-2.5 pb-2.5 border-b border-[var(--color-card-border)]">
        <div className="w-7 h-7 rounded-full bg-[var(--color-accent-light)]/40 flex items-center justify-center">
          <Mail size={13} className="text-[var(--color-accent-hover)]" />
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">From: <span className="text-[var(--color-text-primary)]">MeddyBuddy</span></div>
      </div>
      <p className="text-sm font-medium text-[var(--color-text-primary)] leading-snug">{subject}</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">{preview}</p>
      <div className="mt-3 inline-flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] bg-[var(--color-background)] border border-[var(--color-card-border)] rounded-full px-2 py-0.5">
        via Brevo
      </div>
    </div>
  );
}

/* very small markdown subset — bold only — to avoid a full markdown
   dependency tree for the landing previews */
function renderMarkdownLite(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="text-[var(--color-accent-hover)]">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}
