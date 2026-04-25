export type Level = { name: string; emoji: string; min: number; next: number | null };

// 7 levels with French Bac flavour
const THRESHOLDS = [
  { name: "Débutant", emoji: "🌱", min: 0 },
  { name: "Curieux", emoji: "🔍", min: 100 },
  { name: "Studieux", emoji: "📖", min: 300 },
  { name: "Scholar", emoji: "🎓", min: 700 },
  { name: "Bac+1", emoji: "🚀", min: 1500 },
  { name: "Expert", emoji: "🏆", min: 3000 },
  { name: "Maître", emoji: "👑", min: 6000 },
];

export function getLevel(xp: number): Level {
  let idx = 0;
  for (let i = 0; i < THRESHOLDS.length; i++) if (xp >= THRESHOLDS[i].min) idx = i;
  const cur = THRESHOLDS[idx];
  const next = THRESHOLDS[idx + 1] ?? null;
  return { name: cur.name, emoji: cur.emoji, min: cur.min, next: next?.min ?? null };
}

export function levelProgress(xp: number) {
  const lvl = getLevel(xp);
  if (lvl.next === null) return { pct: 100, current: xp - lvl.min, span: 0, capped: true };
  const span = lvl.next - lvl.min;
  const current = xp - lvl.min;
  return { pct: Math.min(100, Math.round((current / span) * 100)), current, span, capped: false };
}

export const XP_PER_QUESTION = 10;
export const XP_PER_PHOTO = 25;
