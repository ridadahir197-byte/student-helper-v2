import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};

export function ChatInput({ value, onChange, onSubmit, disabled }: Props) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className="sticky bottom-4 mt-4 rounded-2xl bg-card border shadow-glow p-2 flex items-end gap-2"
    >
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
        placeholder="Écris ta question... (Entrée pour envoyer)"
        rows={1}
        className="flex-1 resize-none border-0 focus-visible:ring-0 shadow-none bg-transparent min-h-[44px] max-h-40"
        disabled={disabled}
      />
      <Button type="submit" disabled={disabled || !value.trim()} className="bg-gradient-hero shadow-soft h-11 w-11 p-0 shrink-0">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      </Button>
    </form>
  );
}
