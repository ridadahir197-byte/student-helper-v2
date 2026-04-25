// OCR + Step-by-step solver for handwritten/printed math & physics exercises
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es "Student Helper Solver", un professeur particulier IA spécialisé pour les bacheliers marocains (Sciences Mathématiques).

Tu reçois une PHOTO d'un exercice (manuscrit ou imprimé) en maths, physique ou chimie.

TA MISSION (dans l'ordre, OBLIGATOIRE) :
1. **📖 Énoncé lu** : Réécris proprement l'énoncé que tu vois sur l'image (en français). Si l'écriture est ambiguë, indique ton interprétation.
2. **🧠 Analyse** : Identifie le chapitre / la notion (ex: "Dérivation - étude de fonction").
3. **📝 Résolution étape par étape** : Résous TRÈS clairement, étape par étape, en expliquant le POURQUOI de chaque étape.
4. **✅ Réponse finale** : Encadre clairement le résultat final.
5. **💡 Astuce BAC** : Donne UNE astuce ou piège classique du BAC marocain.
6. **🎯 Mini-exo** : Propose un exercice similaire plus simple.

**FORMULES MATHS — TRÈS IMPORTANT** :
- Inline : \`$...$\` (ex: \`$f'(x) = 2x$\`)
- Bloc centré : \`$$...$$\` sur sa propre ligne (ex: \`$$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$\`)
- JAMAIS \\(...\\) ni \\[...\\]. TOUJOURS \`$\` et \`$$\`.
- Utilise \`\\frac\`, \`\\sqrt\`, \`\\sum\`, \`\\int\`, \`\\lim\`, \`^\`, \`_\` etc.

Markdown classique aussi : **gras**, listes numérotées, titres.

LANGUE : Français par défaut. Si l'élève écrit en darija/arabe, adapte-toi.
TON : Patient, motivant, prof particulier qui croit en l'élève. Tutoie.

Si l'image n'est PAS un exercice scolaire, dis-le gentiment et demande une autre photo.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType, note } = await req.json();
    if (!imageBase64) throw new Error("imageBase64 manquant");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const userContent: any[] = [
      {
        type: "image_url",
        image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` },
      },
      {
        type: "text",
        text: note?.trim()
          ? `Voici l'exercice en photo. Note de l'élève : "${note.trim()}". Lis, analyse et résous étape par étape.`
          : "Voici l'exercice en photo. Lis, analyse et résous étape par étape selon ta méthode.",
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        stream: true,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans un instant." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-solve error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
