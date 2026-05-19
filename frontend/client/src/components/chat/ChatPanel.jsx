import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import MessageInput from "./MessageInput";

export default function ChatPanel({ messages = [], onSend, sending = false }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="card !p-0 flex-1 flex flex-col overflow-hidden">
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
          />
        </div>
      </div>
    </div>
  );
}
