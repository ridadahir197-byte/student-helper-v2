import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/tutor");
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Compte créé ! Bienvenue 🎉");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connecté !");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(msg.includes("Invalid login") ? "Email ou mot de passe incorrect" : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Connexion — Student Helper</title>
        <meta name="description" content="Connecte-toi à ton coach IA pour le BAC." />
      </Helmet>
      <div className="min-h-screen bg-gradient-soft grid place-items-center px-4 py-10">
        <div className="absolute top-6 left-6"><Logo /></div>
        <div className="w-full max-w-md rounded-3xl bg-card border shadow-glow p-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === "signup" ? "Crée ton compte" : "Bon retour 👋"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup" ? "Commence à réviser intelligemment." : "Reprenons là où tu t'es arrêté."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Prénom</Label>
                <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Yassine" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={busy} className="w-full h-11 bg-gradient-hero shadow-soft hover:shadow-glow">
              {busy ? "Patiente..." : mode === "signup" ? "Créer mon compte" : "Se connecter"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-primary font-medium hover:underline">
              {mode === "signup" ? "Connexion" : "Créer un compte"}
            </button>
          </p>

          <Link to="/" className="block mt-4 text-center text-xs text-muted-foreground hover:text-foreground">← Retour à l'accueil</Link>
        </div>
      </div>
    </>
  );
}
