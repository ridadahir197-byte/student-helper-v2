import { forwardRef } from "react";
import { MathMarkdown } from "@/components/MathMarkdown";
import type { Msg } from "./types";

const SUGGESTIONS = [
  "Explique-moi les nombres complexes simplement",
  "Kifach n7el équation différentielle ?",
  "Donne-moi un exo de dérivée niveau BAC",
  "C'est quoi la loi de Coulomb ?",
];

type Props = {
  messages: Msg[];
  streaming: boolean;
  onSuggestion: (text: string) => void;
};

export const MessageList = forwardRef<HTMLDivElement, Props>(function MessageList(
  { messages, streaming, onSuggestion }, ref
) {
  return (
    <div ref={ref} className="flex-1 overflow-y-auto space-y-4 pb-4">
      {messages.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-hero shadow-glow grid place-items-center text-2xl">🎓</div>
          <h2 className="mt-4 text-2xl font-bold">Salut ! Comment je peux t'aider ?</h2>
          <p className="mt-2 text-muted-foreground">Pose ta question en français, arabe ou darija.</p>
          <div className="mt-8 grid sm:grid-cols-2 gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => onSuggestion(s)} className="text-left rounded-xl border bg-card p-4 text-sm hover:shadow-soft hover:border-primary/30 transition">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            m.role === "user"
              ? "bg-gradient-hero text-primary-foreground rounded-tr-sm shadow-soft whitespace-pre-wrap"
              : "bg-card border rounded-tl-sm shadow-soft"
          }`}>
            {m.role === "user"
              ? (m.content || <span className="opacity-50">…</span>)
              : (m.content ? <MathMarkdown>{m.content}</MathMarkdown> : <span className="opacity-50">…</span>)}
          </div>
        </div>
      ))}

      {streaming && messages[messages.length - 1]?.role === "user" && (
        <div className="flex justify-start">
          <div className="bg-card border rounded-2xl rounded-tl-sm px-4 py-3 shadow-soft">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
