import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft, Mail } from "lucide-react";

export default function AuthScreen({ onAuth, defaultMode = "login", onBack }) {
  const [mode, setMode] = useState(defaultMode); // "login" | "register"
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }
    if (mode === "register" && email.trim() !== "") {
      const looksLikeEmail = /.+@.+\..+/.test(email.trim());
      if (!looksLikeEmail) {
        setError("That email doesn't look right — double-check the format.");
        return;
      }
    }
    setLoading(true);
    try {
      await onAuth(mode, username.trim(), password, email.trim());
    } catch (err) {
      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 relative overflow-hidden bg-[var(--color-background)]">
      {/* Floating decorative blobs */}
      <motion.div
        aria-hidden
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle, #C4956A 0%, transparent 70%)" }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, #D4A87A 0%, transparent 70%)" }}
        animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
        <div className="card !p-8">
          {/* Logo + title */}
          <div className="flex flex-col items-center mb-7">
            <motion.div
              animate={{ rotate: [0, -6, 6, -4, 4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              className="w-14 h-14 rounded-2xl bg-[var(--color-dark)] flex items-center justify-center shadow-md mb-4"
            >
              <Pill size={26} className="text-[var(--color-accent-light)]" />
            </motion.div>
            <h1 className="text-3xl text-[var(--color-text-primary)]">MeddyBuddy</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 text-center max-w-xs">
              Your proactive AI medication companion
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex p-1 bg-[var(--color-background)] rounded-full mb-6 border border-[var(--color-card-border)]">
            {[
              { id: "login",    label: "Sign in" },
              { id: "register", label: "Create account" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setMode(m.id); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  mode === m.id
                    ? "bg-[var(--color-dark)] text-white shadow"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 ml-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="harsh"
                className="input-field"
              />
            </div>

            <AnimatePresence initial={false}>
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 ml-1 flex items-center gap-1.5">
                    <Mail size={11} /> Email <span className="text-[var(--color-text-muted)]/60">(recommended)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="input-field"
                  />
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 ml-1 leading-snug">
                    We'll use this to send medication reminders. You can add it later in Settings.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  className="input-field pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-2xl text-sm text-[var(--color-error)]"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {mode === "login" ? "Signing in…" : "Creating account…"}
                </>
              ) : (
                mode === "login" ? "Sign in" : "Create account"
              )}
            </button>
          </form>

          <p className="text-xs text-center text-[var(--color-text-muted)] mt-7">
            Built with Jac 2.0 + Claude Sonnet 4.6 · JacHacks Spring 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
}
