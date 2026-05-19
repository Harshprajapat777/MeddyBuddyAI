import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

const DEFAULT_SUGGESTIONS = [
  "What medications am I on?",
  "I just took my aspirin",
  "How's my adherence this week?",
  "Is ibuprofen safe with metformin?",
];

export default function MessageInput({
  onSend,
  disabled,
  showSuggestions = true,
  suggestions,
  placeholder = "Talk to MeddyBuddy…",
}) {
  const SUGGESTIONS = suggestions ?? DEFAULT_SUGGESTIONS;
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  function submit(e) {
    e?.preventDefault?.();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  // Auto-grow textarea up to 5 rows.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 24 * 6)}px`;
  }, [text]);

  return (
    <div className="space-y-3">
      {showSuggestions && text.trim() === "" && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSend?.(s)}
              disabled={disabled}
              className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-card)] border border-[var(--color-card-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={submit}
        className="flex items-end gap-2 bg-[var(--color-card)] border border-[var(--color-card-border)] rounded-3xl p-2 shadow-sm focus-within:border-[var(--color-accent)] transition-colors"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent outline-none px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/70 max-h-36"
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="w-9 h-9 shrink-0 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          aria-label="Send"
        >
          {disabled ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>
    </div>
  );
}
