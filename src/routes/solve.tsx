import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { MathMarkdown } from "@/components/MathMarkdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGamification } from "@/hooks/useGamification";
import { XP_PER_PHOTO } from "@/lib/levels";
import { XpBadge } from "@/components/gamification/XpBadge";

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SolvePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { awardXp } = useGamification();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [solution, setSolution] = useState("");
  const [streaming, setStreaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const onPick = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Choisis une image (JPG, PNG, HEIC...)"); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("Image trop lourde (max 10 Mo)"); return; }
    setFile(f);
    setSolution("");
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setSolution("");
    setNote("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const solve = async () => {
    if (!file || streaming) return;
    setStreaming(true);
    setSolution("");

    try {
      const { base64, mimeType } = await fileToBase64(file);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-solve`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageBase64: base64, mimeType, note }),
      });

      if (resp.status === 429) { toast.error("Trop de requêtes, réessaie."); setStreaming(false); return; }
      if (resp.status === 402) { toast.error("Crédits IA épuisés."); setStreaming(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Erreur réseau");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { acc += content; setSolution(acc); }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }

      if (acc.trim() && user) {
        try {
          const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
          const path = `${user.id}/${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("exercises").upload(path, file, {
            contentType: file.type || "image/jpeg",
            upsert: false,
          });
          if (upErr) throw upErr;
          const { error: insErr } = await supabase.from("solved_exercises").insert({
            user_id: user.id,
            image_path: path,
            note: note.trim() || null,
            solution: acc,
          });
          if (insErr) throw insErr;
          awardXp(XP_PER_PHOTO);
          toast.success("Exercice sauvegardé dans Mes exos");
        } catch (saveErr) {
          console.error("save error:", saveErr);
          toast.error("Solution affichée mais non sauvegardée");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'analyse");
    } finally {
      setStreaming(false);
    }
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Chargement...</div>;

  return (
    <>
      <Helmet>
        <title>Photo Solver — Student Helper</title>
        <meta name="description" content="Prends en photo un exercice et reçois la solution détaillée étape par étape." />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-gradient-soft">
        <header className="border-b bg-card/70 backdrop-blur sticky top-0 z-10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2">
              <Link to="/tutor" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">Tuteur</Link>
              <Link to="/history" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">Mes exos</Link>
              <XpBadge />
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>Déconnexion</Button>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl w-full">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-hero shadow-glow grid place-items-center text-2xl">📸</div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold">Photo Solver</h1>
            <p className="mt-1 text-muted-foreground text-sm">Prends en photo un exercice → l'IA le lit et le résout étape par étape.</p>
          </div>

          {!preview && (
            <label className="block">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              />
              <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-card hover:bg-card/80 p-10 text-center cursor-pointer transition">
                <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-hero/20 grid place-items-center text-2xl">📷</div>
                <p className="mt-4 font-semibold">Touche pour prendre une photo</p>
                <p className="text-sm text-muted-foreground mt-1">ou choisis une image depuis ta galerie</p>
                <p className="text-xs text-muted-foreground mt-3">JPG, PNG, HEIC · max 10 Mo</p>
              </div>
            </label>
          )}

          {preview && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border bg-card shadow-soft">
                <img src={preview} alt="Exercice" className="w-full max-h-80 object-contain bg-black/5" />
              </div>

              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note optionnelle (ex: 'je bloque sur la question 2', 'explique-moi la dérivée'...)"
                rows={2}
                className="bg-card"
                disabled={streaming}
              />

              <div className="flex gap-2">
                <Button onClick={solve} disabled={streaming} className="flex-1 bg-gradient-hero shadow-soft h-11">
                  {streaming ? "Analyse en cours..." : "✨ Résoudre cet exercice"}
                </Button>
                <Button variant="outline" onClick={reset} disabled={streaming} className="h-11">Changer</Button>
              </div>
            </div>
          )}

          {(streaming || solution) && (
            <div className="mt-6 rounded-2xl border bg-card shadow-soft p-5">
              {!solution && streaming && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-sm">Lecture de l'image et résolution...</span>
                </div>
              )}
              {solution && <MathMarkdown>{solution}</MathMarkdown>}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Vérifie toujours les calculs importants. <Link to="/tutor" className="underline">Tuteur chat</Link> · <Link to="/" className="underline">Accueil</Link>
          </p>
        </main>
      </div>
    </>
  );
}
