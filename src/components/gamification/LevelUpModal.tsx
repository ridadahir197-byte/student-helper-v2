import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import type { Level } from "@/lib/levels";

type Props = {
  open: boolean;
  onClose: () => void;
  level: Level | null;
};

function fireConfetti() {
  const duration = 1500;
  const end = Date.now() + duration;
  const colors = ["#7c3aed", "#a855f7", "#ec4899", "#f59e0b", "#10b981"];
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 }, colors });
}

export function LevelUpModal({ open, onClose, level }: Props) {
  useEffect(() => {
    if (open) fireConfetti();
  }, [open]);

  if (!level) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="text-6xl mb-2 animate-scale-in">{level.emoji}</div>
          <DialogTitle className="text-2xl">Niveau atteint !</DialogTitle>
          <DialogDescription className="text-base">
            Tu es maintenant <span className="font-bold text-foreground">{level.name}</span>. Continue comme ça ! 🚀
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="bg-gradient-hero shadow-soft">Continuer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
