import { useEffect, useRef, useState } from "react";
import { Check, Sparkles, MessageSquarePlus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import MessageInput from "./MessageInput";

export default function ChatPanel({
  messages = [],
  onSend,
  sending = false,
  onboardingMode = false,
  onboardingCanFinish = false,
  onFinishOnboarding,
  onNewChat,
  suggestions,
  placeholder,
}) {
  const [clearing, setClearing] = useState(false);

  async function handleNewChat() {
    if (!onNewChat || clearing) return;
    setClearing(true);
    try {
      await onNewChat();
    } finally {
      setClearing(false);
    }
  }
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="card !p-0 flex-1 flex flex-col overflow-hidden">
        {/* Onboarding banner (during setup) OR chat toolbar (after) */}
        <AnimatePresence mode="wait">
          {onboardingMode ? (
            <motion.div
              key="onboarding-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="px-4 sm:px-5 py-2.5 bg-[var(--color-accent-light)]/20 border-b border-[var(--color-card-border)] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles size={14} className="shrink-0 text-[var(--color-accent-hover)]" />
                <span className="text-xs text-[var(--color-text-primary)] truncate">
                  Setting up your medications — chat naturally, no forms.
                </span>
              </div>
              {onboardingCanFinish && (
                <button
                  type="button"
                  onClick={onFinishOnboarding}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-full bg-[var(--color-dark)] text-white hover:bg-[var(--color-dark-secondary)] transition-colors"
                >
                  <Check size={11} /> I'm done
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chat-toolbar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 sm:px-5 py-2.5 border-b border-[var(--color-card-border)] flex items-center justify-between gap-3 bg-[var(--color-card)]/60"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                <span className="text-xs text-[var(--color-text-muted)] truncate">
                  MeddyBuddy — Claude Sonnet 4.6
                </span>
              </div>
              {onNewChat && (
                <button
                  type="button"
                  onClick={handleNewChat}
                  disabled={clearing || sending}
                  className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full bg-[var(--color-background)] border border-[var(--color-card-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
                  title="Start a fresh conversation"
                >
                  {clearing ? <Loader2 size={11} className="animate-spin" /> : <MessageSquarePlus size={11} />}
                  New chat
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4"
        >
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {sending && <TypingIndicator />}
        </div>

        <div className="border-t border-[var(--color-card-border)] p-3 sm:p-4 bg-[var(--color-card)]">
          <MessageInput
            onSend={onSend}
            disabled={sending}
            showSuggestions={messages.length <= 1}
            suggestions={suggestions}
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
}
