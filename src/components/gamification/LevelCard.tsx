import { useGamification } from "@/hooks/useGamification";
import { getLevel, levelProgress } from "@/lib/levels";

export function LevelCard() {
  const { xp, streak, loading } = useGamification();
  if (loading) return null;
  const level = getLevel(xp);
  const prog = levelProgress(xp);

  return (
    <div className="rounded-xl border bg-gradient-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none">{level.emoji}</span>
          <span className="text-sm font-semibold truncate">{level.name}</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium" title={`Série : ${streak} jour(s)`}>
          <span>🔥</span>
          <span>{streak}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-hero transition-all"
          style={{ width: `${prog.pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{xp} XP</span>
        <span>{prog.capped ? "Niveau max" : `${prog.current}/${prog.span}`}</span>
      </div>
    </div>
  );
}
