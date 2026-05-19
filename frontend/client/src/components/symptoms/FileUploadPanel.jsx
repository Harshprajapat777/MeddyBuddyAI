import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Paperclip, FileText, Image as ImageIcon, Loader2, X, AlertTriangle, CheckCircle2 } from "lucide-react";

const FLAG_LABEL = {
  acne: "Acne",
  eczema_dermatitis: "Eczema / dermatitis",
  psoriasis: "Psoriasis",
  rosacea: "Rosacea",
  skin_infection: "Skin infection",
  rash_or_allergic: "Rash / allergic",
};

export default function FileUploadPanel({ onAnalyze }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);

  function pick() {
    if (busy) return;
    inputRef.current?.click();
  }

  function clear() {
    setResult(null);
    setError("");
    setFileMeta(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    setBusy(true);
    setFileMeta({ name: file.name, type: file.type, size: file.size });
    try {
      const b64 = await fileToBase64(file);
      const data = await onAnalyze(b64, file.type, file.name);
      setResult(data);
    } catch (err) {
      setError(err?.message ?? "Couldn't analyze that file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card !p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
            Upload a report or image
          </p>
          <p className="text-sm text-[var(--color-text-primary)] mt-0.5">
            PDF lab reports or skin photos
          </p>
        </div>
        {(result || error) && (
          <button
            type="button"
            onClick={clear}
            className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {!result && !error && (
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          className="w-full border-2 border-dashed border-[var(--color-card-border)] rounded-2xl p-6 text-center hover:border-[var(--color-accent)] hover:bg-[var(--color-background)]/30 transition-colors disabled:opacity-50"
        >
          {busy ? (
            <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
              <Loader2 size={22} className="animate-spin text-[var(--color-accent-hover)]" />
              <span className="text-sm">Analyzing {fileMeta?.name ?? "file"}…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
              <Paperclip size={22} className="text-[var(--color-accent-hover)]" />
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                Click to upload PDF or image
              </span>
              <span className="text-[11px]">Max 5MB · PDF lab reports or skin photos</span>
            </div>
          )}
        </button>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-sm text-[var(--color-success)]">
            <CheckCircle2 size={14} />
            <span className="font-medium">Analyzed {fileMeta?.name}</span>
          </div>

          {result.file_type === "pdf" && (
            <PdfReportView analysis={result} />
          )}

          {result.file_type === "image" && (
            <ImageAnalysisView analysis={result} />
          )}

          <div className="text-[11px] text-[var(--color-text-muted)] italic border-t border-[var(--color-card-border)] pt-3">
            Not a diagnosis. Always confirm with a clinician or dermatologist.
          </div>
        </motion.div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}

function PdfReportView({ analysis }) {
  return (
    <>
      <div>
        <h4 className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
          <FileText size={14} className="text-[var(--color-accent-hover)]" /> Summary
        </h4>
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed bg-[var(--color-background)]/60 border border-[var(--color-card-border)] rounded-2xl p-3">
          {analysis.summary}
        </p>
      </div>

      {analysis.detected_flags?.length > 0 && (
        <FlagsRow flags={analysis.detected_flags} />
      )}

      {analysis.abnormal_findings?.length > 0 && (
        <ListBlock title="Notable findings" items={analysis.abnormal_findings} icon={AlertTriangle} />
      )}

      {analysis.next_steps?.length > 0 && (
        <ListBlock title="Next steps" items={analysis.next_steps} />
      )}
    </>
  );
}

function ImageAnalysisView({ analysis }) {
  const raw = analysis.raw_analysis ?? "";
  // Try to extract a JSON block from the LLM reply. Fall back to raw text.
  const parsed = tryParseJson(raw);

  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <ImageIcon size={14} className="text-[var(--color-accent-hover)]" />
        <span className="text-sm font-semibold">Image triage</span>
      </div>

      {parsed?.detected_flags?.length > 0 && (
        <FlagsRow flags={parsed.detected_flags} confidence={parsed.confidence} />
      )}

      {parsed?.description ? (
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed bg-[var(--color-background)]/60 border border-[var(--color-card-border)] rounded-2xl p-3">
          {parsed.description}
        </p>
      ) : (
        <pre className="text-xs text-[var(--color-text-primary)] whitespace-pre-wrap bg-[var(--color-background)]/60 border border-[var(--color-card-border)] rounded-2xl p-3">
          {raw}
        </pre>
      )}

      {parsed?.next_steps?.length > 0 && (
        <ListBlock title="Next steps" items={parsed.next_steps} />
      )}
    </>
  );
}

function FlagsRow({ flags, confidence }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-medium mb-1.5">
        Detected flags {confidence && <span className="lowercase">· confidence: {confidence}</span>}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {flags.map((f) => (
          <span key={f} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--color-accent-light)]/30 text-[var(--color-accent-hover)] border border-[var(--color-accent)]/30">
            {FLAG_LABEL[f] ?? f}
          </span>
        ))}
      </div>
    </div>
  );
}

function ListBlock({ title, items, icon: Icon }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon size={14} className="text-[var(--color-accent-hover)]" />} {title}
      </h4>
      <ul className="space-y-1">
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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result ?? "";
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function tryParseJson(text) {
  if (!text) return null;
  // Find the first { and last } and attempt to parse the slice.
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(text.slice(a, b + 1)); }
  catch { return null; }
}
