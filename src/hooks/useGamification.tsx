import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLevel, type Level } from "@/lib/levels";
import { toast } from "sonner";

type LevelUpListener = (lvl: Level) => void;
const listeners = new Set<LevelUpListener>();
export function onLevelUp(fn: LevelUpListener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

type Stats = { xp: number; streak: number; last_active_date: string | null };

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string) {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
}

export function useGamification() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ xp: 0, streak: 0, last_active_date: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("xp, streak, last_active_date")
        .eq("id", user.id)
        .maybeSingle();
      if (data) setStats({ xp: data.xp ?? 0, streak: data.streak ?? 0, last_active_date: data.last_active_date ?? null });
      setLoading(false);
    })();
  }, [user]);

  const awardXp = useCallback(async (amount: number) => {
    if (!user) return;
    const today = todayISO();
    const last = stats.last_active_date;
    let newStreak = stats.streak;
    if (!last) newStreak = 1;
    else {
      const diff = daysBetween(last, today);
      if (diff === 0) newStreak = stats.streak || 1;
      else if (diff === 1) newStreak = stats.streak + 1;
      else newStreak = 1;
    }
    const prevXp = stats.xp;
    const newXp = prevXp + amount;
    const prevLevel = getLevel(prevXp).name;
    const newLevel = getLevel(newXp).name;
    const streakIncreased = newStreak > stats.streak;

    setStats({ xp: newXp, streak: newStreak, last_active_date: today });

    const { error } = await supabase
      .from("profiles")
      .update({ xp: newXp, streak: newStreak, last_active_date: today })
      .eq("id", user.id);
    if (error) {
      console.error("XP update failed", error);
      setStats((p) => ({ ...p, xp: prevXp, streak: stats.streak, last_active_date: last }));
      return;
    }

    if (newLevel !== prevLevel) {
      const lvl = getLevel(newXp);
      listeners.forEach((fn) => fn(lvl));
    } else if (streakIncreased && newStreak > 1) toast.success(`🔥 ${newStreak} jours d'affilée !`);
    else toast.success(`+${amount} XP`, { duration: 1500 });
  }, [user, stats]);

  return { ...stats, loading, awardXp };
}
