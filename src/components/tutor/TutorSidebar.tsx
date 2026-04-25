import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { LevelCard } from "@/components/gamification/LevelCard";
import type { Conv } from "./types";

type Props = {
  convs: Conv[];
  activeId: string | null;
  search: string;
  setSearch: (v: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string) => void;
  onNewChat: () => void;
  open: boolean;
  onClose: () => void;
};

export function TutorSidebar({
  convs, activeId, search, setSearch, onSelect, onDelete, onRename, onNewChat, open, onClose,
}: Props) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const q = search.trim().toLowerCase();
  const filtered = q ? convs.filter((c) => c.title.toLowerCase().includes(q)) : convs;

  const renderGroups = () => {
    if (convs.length > 0 && filtered.length === 0) {
      return <p className="text-xs text-muted-foreground text-center py-4 px-3">Aucun résultat</p>;
    }
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOfWeek = startOfToday - 6 * 86400000;
    const groups: { label: string; items: Conv[] }[] = [
      { label: "Aujourd'hui", items: [] },
      { label: "Hier", items: [] },
      { label: "Cette semaine", items: [] },
      { label: "Plus ancien", items: [] },
    ];
    for (const c of filtered) {
      const t = new Date(c.created_at).getTime();
      if (t >= startOfToday) groups[0].items.push(c);
      else if (t >= startOfYesterday) groups[1].items.push(c);
      else if (t >= startOfWeek) groups[2].items.push(c);
      else groups[3].items.push(c);
    }
    return groups
      .filter((g) => g.items.length > 0)
      .map((g) => (
        <div key={g.label} className="space-y-1">
          <p className="px-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{g.label}</p>
          {g.items.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-1 rounded-lg px-2 py-2 text-sm cursor-pointer transition ${
                activeId === c.id ? "bg-primary/10 text-foreground" : "hover:bg-muted/50 text-muted-foreground"
              }`}
              onClick={() => onSelect(c.id)}
            >
              <span className="flex-1 truncate">{c.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onRename(c.id); }}
                className="opacity-0 group-hover:opacity-100 text-xs px-1.5 py-0.5 rounded hover:bg-primary/10 hover:text-primary transition"
                aria-label="Renommer avec l'IA"
                title="Renommer avec l'IA"
              >
                ✨
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                className="opacity-0 group-hover:opacity-100 text-xs px-1.5 py-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition"
                aria-label="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ));
  };

  return (
    <>
      <aside className={`${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:sticky top-0 left-0 z-30 h-screen w-72 bg-card border-r flex flex-col transition-transform`}>
        <div className="h-16 px-4 flex items-center justify-between border-b">
          <Logo />
          <Button size="sm" variant="ghost" className="md:hidden" onClick={onClose}>✕</Button>
        </div>
        <div className="p-3 space-y-2">
          <Button onClick={onNewChat} className="w-full bg-gradient-hero shadow-soft">+ Nouvelle discussion</Button>
          {convs.length > 0 && (
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full h-8 pl-8 pr-7 text-xs rounded-md bg-muted/50 border border-transparent focus:border-primary/30 focus:bg-background outline-none transition"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs" aria-label="Effacer">✕</button>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-4">
          {convs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6 px-3">Aucune discussion. Démarres-en une !</p>
          )}
          {renderGroups()}
        </div>
        <div className="border-t p-3 text-xs text-muted-foreground space-y-2">
          <LevelCard />
          <div className="flex flex-col gap-1">
            <Link to="/solve" className="hover:text-foreground">📸 Photo Solver</Link>
            <Link to="/history" className="hover:text-foreground">📚 Mes exos</Link>
            <Link to="/" className="hover:text-foreground">🏠 Accueil</Link>
          </div>
          <div className="pt-2 border-t flex items-center justify-between">
            <span className="truncate">{user?.email}</span>
            <button onClick={async () => { await signOut(); navigate("/"); }} className="hover:text-foreground shrink-0 ml-2">Sortir</button>
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={onClose} />}
    </>
  );
}
