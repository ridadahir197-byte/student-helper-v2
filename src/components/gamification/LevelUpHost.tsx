import { useEffect, useState } from "react";
import { onLevelUp } from "@/hooks/useGamification";
import { LevelUpModal } from "./LevelUpModal";
import type { Level } from "@/lib/levels";

export function LevelUpHost() {
  const [level, setLevel] = useState<Level | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const off = onLevelUp((lvl) => {
      setLevel(lvl);
      setOpen(true);
    });
    return () => { off(); };
  }, []);

  return <LevelUpModal open={open} onClose={() => setOpen(false)} level={level} />;
}
