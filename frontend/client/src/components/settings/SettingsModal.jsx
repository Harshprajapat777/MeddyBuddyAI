import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, HeartHandshake, Loader2, Check, Send } from "lucide-react";

export default function SettingsModal({
  open,
  profile,
  onClose,
  onSave,
  onSendTestEmail,
}) {
  const [email, setEmail] = useState("");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(0);
  const [testStatus, setTestStatus] = useState({ state: "idle", text: "" });

  // Seed from profile when modal opens
  useEffect(() => {
    if (!open) return;
    setEmail(profile?.email ?? "");
    setCaregiverEmail(profile?.caregiver_email ?? "");
    setTimezone(profile?.timezone ?? "Asia/Kolkata");
    setError("");
    setSavedAt(0);
    setTestStatus({ state: "idle", text: "" });
  }, [open, profile]);

  async function handleSave(e) {
    e?.preventDefault?.();
    setError("");
    setSaving(true);
    try {
      await onSave({
        email: email.trim(),
        caregiver_email: caregiverEmail.trim(),
        timezone: timezone.trim(),
      });
      setSavedAt(Date.now());
    } catch (err) {
      setError(err?.message ?? "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTestStatus({ state: "sending", text: "Sending…" });
    try {
      const r = await onSendTestEmail();
      const ok = r?.status === "ok" || r?.result?.ok;
      setTestStatus({
        state: ok ? "ok" : "error",
        text: ok
          ? `Sent — check ${email || "your inbox"} 📬`
          : r?.result?.error ?? r?.message ?? "Send failed",
      });
    } catch (err) {
      setTestStatus({ state: "error", text: err?.message ?? "Send failed" });
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
          <motion.form
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
            className="bg-[var(--color-card)] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[var(--color-card-border)]"
          >
            <header className="flex items-center justify-between p-5 border-b border-[var(--color-card-border)]">
              <div className="flex items-center gap-2">
                <User size={20} className="text-[var(--color-accent-hover)]" />
                <h2 className="text-xl">Settings</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--color-background)] transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 ml-1 flex items-center gap-1.5">
                  <Mail size={11} /> Your email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                />
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 ml-1">
                  Used for medication reminders.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 ml-1 flex items-center gap-1.5">
                  <HeartHandshake size={11} /> Caregiver email <span className="text-[var(--color-text-muted)]/60">(optional)</span>
                </label>
                <input
                  type="email"
                  value={caregiverEmail}
                  onChange={(e) => setCaregiverEmail(e.target.value)}
                  placeholder="family@example.com"
                  className="input-field"
                />
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 ml-1 leading-snug">
                  We'll send them your weekly adherence digest. Helpful for family members checking in remotely.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 ml-1">
                  Timezone
                </label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Asia/Kolkata"
                  className="input-field"
                />
              </div>

              {error && (
                <p className="text-sm text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-2xl px-3 py-2">
                  {error}
                </p>
              )}

              <div className="pt-3 border-t border-[var(--color-card-border)]">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={!email || testStatus.state === "sending"}
                  className="btn-secondary !py-2 !px-4 text-sm w-full"
                >
                  {testStatus.state === "sending" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Send test email
                </button>
                {testStatus.text && (
                  <p className={`text-[12px] mt-2 ml-1 ${
                    testStatus.state === "ok"
                      ? "text-[var(--color-success)]"
                      : testStatus.state === "error"
                        ? "text-[var(--color-error)]"
                        : "text-[var(--color-text-muted)]"
                  }`}>
                    {testStatus.text}
                  </p>
                )}
              </div>
            </div>

            <footer className="flex justify-end gap-2 p-4 border-t border-[var(--color-card-border)] bg-[var(--color-background)]/50">
              <button type="button" onClick={onClose} className="btn-secondary !py-2">
                Close
              </button>
              <button type="submit" disabled={saving} className="btn-primary !py-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> :
                  (savedAt && Date.now() - savedAt < 2000) ? <Check size={14} /> : null}
                {saving ? "Saving…" : (savedAt && Date.now() - savedAt < 2000) ? "Saved" : "Save changes"}
              </button>
            </footer>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
