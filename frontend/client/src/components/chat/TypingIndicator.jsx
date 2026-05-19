import { Pill } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--color-dark)] flex items-center justify-center mt-1">
        <Pill size={14} className="text-[var(--color-accent-light)]" />
      </div>
      <div className="bg-[var(--color-card-assistant)] border border-[var(--color-card-border)] rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
        <div className="dot-typing flex gap-1.5 items-center h-5">
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
        </div>
      </div>
    </div>
  );
}
