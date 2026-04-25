import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { MathMarkdown } from "@/components/MathMarkdown";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Exo = {
  id: string;
  image_path: string;
  note: string | null;
  solution: string;
  created_at: string;
  signed_url?: string;
};

export default function HistoryPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [exos, setExos] = useState<Exo[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingList(true);
      const { data, error } = await supabase
        .from("solved_exercises")
        .select("id, image_path, note, solution, created_at")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Erreur de chargement");
        setLoadingList(false);
        return;
      }
      const paths = (data ?? []).map((d) => d.image_path);
      const signed = paths.length
        ? await supabase.storage.from("exercises").createSignedUrls(paths, 3600)
        : { data: [] as { signedUrl: string | null; path: string | null }[] };
      const urlMap = new Map<string, string>();
      (signed.data ?? []).forEach((s) => {
        if (s.path && s.signedUrl) urlMap.set(s.path, s.signedUrl);
      });
      setExos((data ?? []).map((d) => ({ ...d, signed_url: urlMap.get(d.image_path) })));
      setLoadingList(false);
    })();
  }, [user]);

  const remove = async (exo: Exo) => {
    if (!confirm("Supprimer cet exercice ?")) return;
    const { error } = await supabase.from("solved_exercises").delete().eq("id", exo.id);
    if (error) { toast.error("Suppression échouée"); return; }
    await supabase.storage.from("exercises").remove([exo.image_path]);
    setExos((p) => p.filter((e) => e.id !== exo.id));
    toast.success("Supprimé");
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Chargement...</div>;

  return (
    <>
      <Helmet>
        <title>Mes exos — Student Helper</title>
        <meta name="description" content="Historique de tes exercices résolus avec Student Helper." />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-gradient-soft">
        <header className="border-b bg-card/70 backdrop-blur sticky top-0 z-10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-3">
              <Link to="/tutor" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">Tuteur</Link>
              <Link to="/solve" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">Solver</Link>
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>Déconnexion</Button>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">📚 Mes exos</h1>
              <p className="text-sm text-muted-foreground mt-1">{exos.length} exercice{exos.length > 1 ? "s" : ""} résolu{exos.length > 1 ? "s" : ""}</p>
            </div>
            <Link to="/solve">
              <Button className="bg-gradient-hero shadow-soft">+ Nouveau</Button>
            </Link>
          </div>

          {loadingList ? (
            <div className="text-center py-12 text-muted-foreground">Chargement...</div>
          ) : exos.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border-2 border-dashed border-primary/30 bg-card">
              <div className="text-4xl">📸</div>
              <p className="mt-4 font-semibold">Aucun exo encore</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Prends en photo ton premier exercice !</p>
              <Link to="/solve"><Button className="bg-gradient-hero shadow-soft">Résoudre un exo</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {exos.map((exo) => {
                const isOpen = openId === exo.id;
                return (
                  <div key={exo.id} className="rounded-2xl border bg-card shadow-soft overflow-hidden">
                    <button
                      onClick={() => setOpenId(isOpen ? null : exo.id)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition"
                    >
                      {exo.signed_url ? (
                        <img src={exo.signed_url} alt="" className="w-16 h-16 rounded-lg object-cover bg-muted shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {exo.note?.trim() || exo.solution.slice(0, 80).replace(/[#*`$]/g, "") + "..."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(exo.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                      <span className="text-muted-foreground text-sm shrink-0">{isOpen ? "▲" : "▼"}</span>
                    </button>

                    {isOpen && (
                      <div className="border-t p-4 space-y-4 bg-muted/10">
                        {exo.signed_url && (
                          <img src={exo.signed_url} alt="Exercice" className="w-full max-h-80 object-contain rounded-lg border bg-black/5" />
                        )}
                        {exo.note && (
                          <p className="text-sm italic text-muted-foreground">Note : {exo.note}</p>
                        )}
                        <MathMarkdown>{exo.solution}</MathMarkdown>
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm" onClick={() => remove(exo)}>Supprimer</Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
