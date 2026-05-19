import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Pill } from "lucide-react";
import { motion } from "framer-motion";

export default function MessageBubble({ role, content }) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--color-dark)] flex items-center justify-center mt-1">
          <Pill size={14} className="text-[var(--color-accent-light)]" />
        </div>
      )}

      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "bg-[var(--color-dark)] text-white rounded-tr-md"
            : "bg-[var(--color-card-assistant)] text-[var(--color-text-primary)] border border-[var(--color-card-border)] rounded-tl-md"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        ) : (
          <div className="prose-llm text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
