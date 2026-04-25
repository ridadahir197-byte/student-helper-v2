import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export default function Landing() {
  return (
    <>
      <Helmet>
        <title>Student Helper — Ton prof IA pour réussir le BAC</title>
        <meta name="description" content="Coach IA personnalisé pour les bacheliers Sciences Maths au Maroc. Explications en français, arabe et darija. Exercices, simulations BAC, suivi de progression." />
        <meta property="og:title" content="Student Helper — Ton prof IA pour réussir le BAC" />
        <meta property="og:description" content="Coach IA personnalisé pour les bacheliers Sciences Maths au Maroc." />
      </Helmet>
      <div className="min-h-screen bg-gradient-soft">
        <header className="container mx-auto px-6 py-5 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Fonctionnalités</a>
            <a href="#how" className="hover:text-foreground transition">Comment ça marche</a>
            <a href="#pricing" className="hover:text-foreground transition">Tarifs</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Connexion</Link></Button>
            <Button asChild size="sm" className="bg-gradient-hero shadow-soft hover:shadow-glow transition-all">
              <Link to="/auth">Commencer gratuit</Link>
            </Button>
          </div>
        </header>

        <section className="container mx-auto px-6 pt-16 pb-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-40">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
            <div className="absolute top-40 right-1/4 w-96 h-96 bg-primary-glow/30 rounded-full blur-3xl" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border shadow-soft text-xs font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Conçu pour le BAC Sciences Maths 🇲🇦
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.05]">
            Ton prof particulier <span className="text-gradient">IA</span><br />
            pour cartonner au BAC
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Explications claires en <strong>français, arabe ou darija</strong>. Exercices adaptés à ton niveau.
            Disponible 24/7. Pensé pour les bacheliers marocains.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-hero shadow-glow hover:scale-105 transition-all h-12 px-8 text-base">
              <Link to="/auth">Essayer gratuitement →</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
              <a href="#features">Voir les fonctionnalités</a>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">✨ Aucune carte bancaire requise</p>

          <div className="mt-16 max-w-2xl mx-auto">
            <div className="rounded-3xl bg-gradient-card border shadow-glow p-6 text-left backdrop-blur">
              <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Student Helper · en ligne
              </div>
              <div className="space-y-3">
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[80%]">
                  Salut ! Kifach ندير دالة مشتقة dyal x²·sin(x) ? 🤔
                </div>
                <div className="bg-gradient-hero text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm max-w-[85%] ml-auto shadow-soft">
                  Bien vu ! On utilise la <strong>règle du produit</strong> : (uv)' = u'v + uv'.
                  Ici u = x², v = sin(x). Donc f'(x) = <strong>2x·sin(x) + x²·cos(x)</strong>. Tu veux qu'on fasse un exo ensemble ?
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="container mx-auto px-6 py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-4xl font-bold">Tout ce qu'il te faut pour <span className="text-gradient">réussir</span></h2>
            <p className="mt-4 text-muted-foreground">Une plateforme pensée pour la réalité du BAC marocain.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "💬", title: "Tuteur IA 24/7", desc: "Pose n'importe quelle question de maths, physique ou chimie. Réponses claires en FR, AR ou darija." },
              { icon: "🎯", title: "Exercices adaptés", desc: "L'IA ajuste la difficulté selon ton niveau réel. Ni trop facile, ni démoralisant." },
              { icon: "🏆", title: "Simulation BAC", desc: "Examens blancs avec correction instantanée et estimation de ta note finale." },
              { icon: "📊", title: "Suivi intelligent", desc: "Visualise tes points forts et faibles. L'IA prédit ta note BAC en temps réel." },
              { icon: "📸", title: "Scan d'exercice", desc: "Prends en photo un exercice, l'IA te le résout étape par étape." },
              { icon: "🔥", title: "Streaks & XP", desc: "Garde la motivation avec des séries quotidiennes et un classement national." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-card border p-6 shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="container mx-auto px-6 py-24">
          <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-12 md:p-16 shadow-glow">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-bold">Prêt à transformer ta préparation BAC ?</h2>
              <p className="mt-4 text-lg opacity-90">Rejoins des centaines d'élèves qui révisent plus intelligemment, pas plus longtemps.</p>
              <Button asChild size="lg" className="mt-8 h-12 px-8 text-base bg-white text-primary hover:bg-white/90">
                <Link to="/auth">Créer mon compte gratuit</Link>
              </Button>
            </div>
          </div>
        </section>

        <footer className="container mx-auto px-6 py-10 text-center text-sm text-muted-foreground border-t">
          © {new Date().getFullYear()} Student Helper · Fait avec ❤️ pour les bacheliers
        </footer>
      </div>
    </>
  );
}
