import { useState } from "react";
import { X, Pill, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FREQUENCIES = [
  { id: "daily",              label: "Daily" },
  { id: "twice_daily",        label: "Twice daily" },
  { id: "three_times_daily",  label: "Three times daily" },
  { id: "as_needed",          label: "As needed" },
  { id: "weekly",             label: "Weekly" },
];

export default function AddMedicationModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [time, setTime] = useState("08:00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setName(""); setDosage(""); setFrequency("daily"); setTime("08:00"); setNotes("");
    setError(""); setLoading(false);
  }

  async function submit(e) {
    e?.preventDefault?.();
    setError("");
    if (!name.trim() || !dosage.trim()) {
      setError("Name and dosage are required.");
      return;
    }
    setLoading(true);
    try {
      // Times: split by comma if user typed multiple, else single.
      const times = time
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await onSubmit({
        med_name: name.trim(),
        dosage: dosage.trim(),
        frequency,
        times: times.length > 0 ? times : ["08:00"],
        notes: notes.trim(),
      });
      reset();
      onClose();
    } catch (err) {
      setError(err?.message ?? "Couldn't add medication.");
    } finally {
      setLoading(false);
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
          onClick={() => { reset(); onClose(); }}
        >
          <motion.form
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="bg-[var(--color-card)] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[var(--color-card-border)]"
          >
            <header className="flex items-center justify-between p-5 border-b border-[var(--color-card-border)]">
              <div className="flex items-center gap-2">
                <Pill size={20} className="text-[var(--color-accent-hover)]" />
                <h2 className="text-xl">Add medication</h2>
              </div>
              <button
                type="button"
                onClick={() => { reset(); onClose(); }}
                className="p-2 rounded-full hover:bg-[var(--color-background)] transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 ml-1">
                  Name <span className="text-[var(--color-error)]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aspirin"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 ml-1">
                    Dosage <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="81mg"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 ml-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="input-field"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 ml-1">
                  Time(s) — comma separated
                </label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="08:00, 20:00"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 ml-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take with food"
                  className="input-field"
                />
              </div>

              {error && (
                <p className="text-sm text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-2xl px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <footer className="flex justify-end gap-2 p-4 border-t border-[var(--color-card-border)] bg-[var(--color-background)]/50">
              <button type="button" onClick={() => { reset(); onClose(); }} className="btn-secondary !py-2">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary !py-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                {loading ? "Adding…" : "Add medication"}
              </button>
            </footer>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
