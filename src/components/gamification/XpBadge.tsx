import { useGamification } from "@/hooks/useGamification";
import { getLevel } from "@/lib/levels";

export function XpBadge() {
  const { xp, streak, loading } = useGamification();
  if (loading) return null;
  const level = getLevel(xp);
  return (
    <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-card border text-xs shadow-soft">
      <span title={level.name}>{level.emoji}</span>
      <span className="font-medium">{xp} XP</span>
      <span className="text-muted-foreground">·</span>
      <span title="Série quotidienne">🔥 {streak}</span>
    </div>
  );
}
